import { hangulChar, hanjaChar } from "./pieces";
import type { Ply, Square } from "./types";

/** `79`, `09`(10행 9열) 같은 두 자리 칸 표기. */
export function formatSquare({ rank, file }: Square): string {
  return `${rank === 10 ? 0 : rank}${file}`;
}

export function parseSquare(text: string): Square {
  if (!/^\d\d$/.test(text)) throw new SyntaxError(`칸 표기가 아닙니다: ${text}`);
  const rank = Number(text[0]);
  const file = Number(text[1]);
  if (file < 1) throw new SyntaxError(`열은 1~9여야 합니다: ${text}`);
  return { rank: rank === 0 ? 10 : rank, file };
}

export type NotationStyle = "hangul" | "hanja";

/**
 * 수를 기보 표기로 바꾼다.
 * - `hangul`: 협회식. `79졸78`, `09차29차장군`, `한수쉼`
 * - `hanja`: 카카오식. `79楚卒78`, `09楚車29車장군`
 */
export function formatPly(ply: Ply, style: NotationStyle = "hangul"): string {
  if (ply.kind === "pass") return "한수쉼";
  const name = style === "hangul" ? hangulChar : hanjaChar;
  const side = style === "hanja" ? (ply.side === "cho" ? "楚" : "漢") : "";
  const captured = ply.captured ? name(ply.captured, ply.side === "cho" ? "han" : "cho") : "";
  return `${formatSquare(ply.from)}${side}${name(ply.piece, ply.side)}${formatSquare(ply.to)}${captured}${
    ply.check ? "장군" : ""
  }`;
}
