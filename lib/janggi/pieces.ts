import type { Piece, PieceType, Side } from "./types";

export const SIDES: readonly Side[] = ["cho", "han"];

export function opposite(side: Side): Side {
  return side === "cho" ? "han" : "cho";
}

const HANGUL_TO_TYPE: Readonly<Record<string, PieceType>> = {
  차: "chariot",
  마: "horse",
  상: "elephant",
  사: "advisor",
  장: "king",
  궁: "king",
  왕: "king",
  포: "cannon",
  졸: "soldier",
  병: "soldier",
};

const HANJA_TO_TYPE: Readonly<Record<string, PieceType>> = {
  車: "chariot",
  馬: "horse",
  象: "elephant",
  士: "advisor",
  將: "king",
  包: "cannon",
  卒: "soldier",
  兵: "soldier",
};

/** 기보의 기물 글자(한글 또는 한자)를 기물 종류로 바꾼다. 모르는 글자면 undefined. */
export function pieceTypeFromChar(ch: string): PieceType | undefined {
  return HANGUL_TO_TYPE[ch] ?? HANJA_TO_TYPE[ch];
}

export function isHangulPieceChar(ch: string): boolean {
  return ch in HANGUL_TO_TYPE;
}

export function isHanjaPieceChar(ch: string): boolean {
  return ch in HANJA_TO_TYPE;
}

/** 협회 표기(한글). 졸/병과 장은 진영에 따라 다르다. */
export function hangulChar(type: PieceType, side: Side): string {
  switch (type) {
    case "chariot":
      return "차";
    case "horse":
      return "마";
    case "elephant":
      return "상";
    case "advisor":
      return "사";
    case "king":
      return "장";
    case "cannon":
      return "포";
    case "soldier":
      return side === "cho" ? "졸" : "병";
  }
}

/** 카카오 표기(한자). */
export function hanjaChar(type: PieceType, side: Side): string {
  switch (type) {
    case "chariot":
      return "車";
    case "horse":
      return "馬";
    case "elephant":
      return "象";
    case "advisor":
      return "士";
    case "king":
      return "將";
    case "cannon":
      return "包";
    case "soldier":
      return side === "cho" ? "卒" : "兵";
  }
}

/** 실제 기물에 새겨진 글자. 장은 楚/漢으로 새긴다. */
export function pieceGlyph(piece: Piece): string {
  if (piece.type === "king") return piece.side === "cho" ? "楚" : "漢";
  return hanjaChar(piece.type, piece.side);
}

export function sideLabel(side: Side): string {
  return side === "cho" ? "초" : "한";
}

/** `초`, `楚`, `한`, `漢` 같은 글자를 진영으로 바꾼다. */
export function sideFromChar(ch: string): Side | undefined {
  if (ch === "초" || ch === "楚") return "cho";
  if (ch === "한" || ch === "漢") return "han";
  return undefined;
}
