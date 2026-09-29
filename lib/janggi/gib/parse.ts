import { createStandardSetup, isFormation, parseBoardNotation } from "../board";
import { parseSquare } from "../notation";
import { opposite, pieceTypeFromChar, sideFromChar } from "../pieces";
import type {
  Comment,
  Formation,
  GameMeta,
  GameRecord,
  GameResult,
  Player,
  Ply,
  ResultReason,
  Setup,
  Side,
} from "../types";

export class GibParseError extends Error {
  constructor(
    message: string,
    /** 텍스트 안에서 몇 번째 대국인지(0부터). */
    readonly gameIndex: number,
    /** 문제가 난 수의 번호(1부터). 헤더 오류면 undefined. */
    readonly moveNumber?: number,
    readonly token?: string,
  ) {
    super(message);
    this.name = "GibParseError";
  }
}

const TAG_LINE = /^\[(\S+)\s+"(.*)"\]\s*$/;
const MOVE_TOKEN =
  /^(\d\d)([楚漢초한])?([\p{Script=Hangul}\p{Script=Han}])(\d\d)([\p{Script=Hangul}\p{Script=Han}])?(장군)?$/u;
const PASS_TOKEN = /^(한수쉼|한수쉬|쉼|pass)$/i;
const MOVE_NUMBER = /^(\d+)\.(.*)$/;

type RawGame = { headerLines: string[]; bodyLines: string[] };

/** 태그 블록이 새로 시작하는 지점마다 대국을 나눈다. */
function splitGames(text: string): RawGame[] {
  const games: RawGame[] = [];
  let current: RawGame | null = null;
  let inHeader = false;
  for (const line of text.split("\n")) {
    const isTag = TAG_LINE.test(line);
    if (isTag) {
      if (!inHeader || !current) {
        current = { headerLines: [], bodyLines: [] };
        games.push(current);
        inHeader = true;
      }
      current.headerLines.push(line);
      continue;
    }
    if (line.trim() === "") continue;
    if (!current) {
      current = { headerLines: [], bodyLines: [] };
      games.push(current);
    }
    inHeader = false;
    current.bodyLines.push(line);
  }
  return games;
}

function parseTags(lines: string[]): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const line of lines) {
    const m = TAG_LINE.exec(line);
    if (m) tags[m[1]] = m[2];
  }
  return tags;
}

export function parsePlayer(text: string): Player {
  const trimmed = text.trim();
  const m = /^(.*\S)\s+(\S*(?:단|급|段|級))$/.exec(trimmed);
  if (m) return { name: m[1], grade: m[2] };
  return { name: trimmed };
}

export function parseResult(text: string): GameResult {
  const raw = text.trim();
  const winner = sideFromChar(raw.charAt(0)) ?? null;
  let reason: ResultReason = "unknown";
  if (/시간/.test(raw)) reason = "time";
  else if (/점수|점\s*승/.test(raw)) reason = "points";
  else if (/접속|끊김/.test(raw)) reason = "disconnect";
  else if (/완[승슫]/.test(raw)) reason = "decisive";
  return { winner, reason, raw };
}

function parseSetup(tags: Record<string, string>, gameIndex: number): Setup {
  if (tags["판"]) {
    try {
      return parseBoardNotation(tags["판"]);
    } catch (e) {
      throw new GibParseError(`판 태그를 해석할 수 없습니다: ${(e as Error).message}`, gameIndex);
    }
  }
  const formation = (key: string): Formation => {
    const value = tags[key]?.trim();
    if (!value) return "마상상마";
    if (!isFormation(value)) throw new GibParseError(`${key} 값이 차림이 아닙니다: ${value}`, gameIndex);
    return value;
  };
  return createStandardSetup({ cho: formation("초차림"), han: formation("한차림") });
}

function parseMeta(tags: Record<string, string>): GameMeta {
  return {
    event: tags["대회명"] ?? "",
    round: tags["회전"] ?? "",
    date: tags["대국일자"] ?? "",
    site: tags["대국장소"] ?? "",
    players: { cho: parsePlayer(tags["초대국자"] ?? ""), han: parsePlayer(tags["한대국자"] ?? "") },
    timeControl: tags["제한시간"] ?? "",
    result: parseResult(tags["대국결과"] ?? ""),
    tags,
  };
}

/** 수 토큰 하나를 해석한다. `turn`은 진영 표기가 없을 때 쓰는 차례. */
export function parseMoveToken(token: string, turn: Side): Ply | undefined {
  if (PASS_TOKEN.test(token)) return { kind: "pass", side: turn };
  const m = MOVE_TOKEN.exec(token);
  if (!m) return undefined;
  const [, from, sideChar, pieceChar, to, capturedChar, check] = m;
  const side = sideChar ? sideFromChar(sideChar) ?? turn : turn;
  const piece = pieceTypeFromChar(pieceChar);
  if (!piece) return undefined;
  const ply: Ply = { kind: "move", side, piece, from: parseSquare(from), to: parseSquare(to), check: !!check };
  if (capturedChar) {
    const captured = pieceTypeFromChar(capturedChar);
    if (!captured) return undefined;
    ply.captured = captured;
  }
  return ply;
}

function parseBody(body: string, setup: Setup, gameIndex: number): { plies: Ply[]; comments: Comment[] } {
  const plies: Ply[] = [];
  const comments: Comment[] = [];
  let turn = setup.turn;
  let lastNumber: number | undefined;
  const pattern = /\{([^}]*)\}|(\S+)/g;
  for (const m of body.matchAll(pattern)) {
    if (m[1] !== undefined) {
      const text = m[1].trim();
      if (text) comments.push({ ply: plies.length, text });
      continue;
    }
    let token = m[2];
    const numbered = MOVE_NUMBER.exec(token);
    if (numbered) {
      lastNumber = Number(numbered[1]);
      token = numbered[2];
      if (!token) continue;
    }
    const ply = parseMoveToken(token, turn);
    if (!ply) {
      throw new GibParseError(`수 표기를 해석할 수 없습니다: ${token}`, gameIndex, lastNumber, token);
    }
    plies.push(ply);
    turn = opposite(ply.side);
  }
  return { plies, comments };
}

function parseGame(raw: RawGame, gameIndex: number): GameRecord {
  const tags = parseTags(raw.headerLines);
  const setup = parseSetup(tags, gameIndex);
  const { plies, comments } = parseBody(raw.bodyLines.join("\n"), setup, gameIndex);
  return { meta: parseMeta(tags), setup, plies, comments };
}

/**
 * GIB 텍스트를 대국 목록으로 해석한다. 협회 표기와 카카오 표기를 모두 받는다.
 * 바이트에서 시작한다면 먼저 `decodeGib`으로 문자열을 만든다.
 */
export function parseGib(text: string): GameRecord[] {
  const normalized = text.replace(/\r\n?/g, "\n").replace(//g, "");
  return splitGames(normalized).map(parseGame);
}
