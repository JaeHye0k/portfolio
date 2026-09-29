import { formatBoardNotation } from "../board";
import { formatPly } from "../notation";
import type { GameRecord, Player } from "../types";

const MOVES_PER_LINE = 6;
const EOL = "\r\n";

function formatPlayer(player: Player): string {
  return player.grade ? `${player.name} ${player.grade}` : player.name;
}

function tag(key: string, value: string): string {
  return `[${key} "${value.replace(/"/g, "'")}"]`;
}

/** 대국 하나를 카카오식(楚/漢 + 한자) GIB 텍스트로 만든다. */
export function serializeGame(record: GameRecord): string {
  const { meta, setup, plies, comments } = record;
  const lines = [
    tag("대회명", meta.event || "미상"),
    tag("회전", meta.round || "미상"),
    tag("대국일자", meta.date || "미상"),
    tag("대국장소", meta.site || "미상"),
    tag("초대국자", formatPlayer(meta.players.cho) || "미상"),
    tag("한대국자", formatPlayer(meta.players.han) || "미상"),
  ];
  if (setup.formations && !setup.handicap) {
    lines.push(tag("초차림", setup.formations.cho), tag("한차림", setup.formations.han));
  }
  lines.push(
    tag("제한시간", meta.timeControl || "미상"),
    tag("총수", String(plies.length)),
    tag("대국결과", meta.result.raw || "미상"),
  );
  if (!setup.formations || setup.handicap) lines.push(tag("판", formatBoardNotation(setup)));
  lines.push("");

  const commentsAt = new Map<number, string[]>();
  for (const c of comments) commentsAt.set(c.ply, [...(commentsAt.get(c.ply) ?? []), c.text]);

  const body: string[] = [];
  let line: string[] = [];
  const flush = () => {
    if (line.length) body.push(line.join(" "));
    line = [];
  };
  for (const text of commentsAt.get(0) ?? []) body.push(`{${text}}`);
  plies.forEach((ply, i) => {
    line.push(`${i + 1}. ${formatPly(ply, "hanja")}`);
    const trailing = commentsAt.get(i + 1);
    if (line.length === MOVES_PER_LINE || trailing) flush();
    for (const text of trailing ?? []) body.push(`{${text}}`);
  });
  flush();
  return [...lines, ...body].join(EOL) + EOL;
}

/** 여러 대국을 한 파일로 만든다. 대국 사이는 빈 줄로 나뉜다. 결과는 UTF-8 문자열이다. */
export function serializeGib(records: readonly GameRecord[]): string {
  return records.map(serializeGame).join(EOL);
}
