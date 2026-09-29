import {
  hangulChar,
  hanjaChar,
  isHangulPieceChar,
  pieceTypeFromChar,
  sideFromChar,
} from "./pieces";
import type { Board, Formation, Piece, Ply, Setup, Side, Square } from "./types";

export const RANKS = 10;
export const FILES = 9;

export const FORMATIONS: readonly Formation[] = ["마상상마", "마상마상", "상마상마", "상마마상"];

export function isFormation(text: string): text is Formation {
  return (FORMATIONS as readonly string[]).includes(text);
}

export function isOnBoard({ rank, file }: Square): boolean {
  return rank >= 1 && rank <= RANKS && file >= 1 && file <= FILES;
}

export function sameSquare(a: Square, b: Square): boolean {
  return a.rank === b.rank && a.file === b.file;
}

export function getPiece(board: Board, { rank, file }: Square): Piece | null {
  return board[rank - 1]?.[file - 1] ?? null;
}

function emptyRows(): (Piece | null)[][] {
  return Array.from({ length: RANKS }, () => Array<Piece | null>(FILES).fill(null));
}

/** 판을 직접 조립할 때 쓴다. 배열은 새로 만들어지므로 호출자가 수정해도 된다. */
export function createBoard(pieces: Iterable<{ square: Square; piece: Piece }>): Board {
  const rows = emptyRows();
  for (const { square, piece } of pieces) {
    if (!isOnBoard(square)) throw new RangeError(`판 밖의 칸입니다: ${square.rank},${square.file}`);
    rows[square.rank - 1][square.file - 1] = piece;
  }
  return rows;
}

/** 표준 배치. 차림은 초 기준 왼쪽부터 2·3·7·8열에 놓인다. */
export function createStandardBoard(formations: Record<Side, Formation>): Board {
  const rows = emptyRows();
  const place = (side: Side, back: number, dir: 1 | -1) => {
    const row = rows[back - 1];
    row[0] = { side, type: "chariot" };
    row[8] = { side, type: "chariot" };
    row[3] = { side, type: "advisor" };
    row[5] = { side, type: "advisor" };
    const chars = [...formations[side]];
    [2, 3, 7, 8].forEach((file, i) => {
      row[file - 1] = { side, type: chars[i] === "마" ? "horse" : "elephant" };
    });
    rows[back + dir - 1][4] = { side, type: "king" };
    rows[back + 2 * dir - 1][1] = { side, type: "cannon" };
    rows[back + 2 * dir - 1][7] = { side, type: "cannon" };
    for (const file of [1, 3, 5, 7, 9]) rows[back + 3 * dir - 1][file - 1] = { side, type: "soldier" };
  };
  place("han", 1, 1);
  place("cho", RANKS, -1);
  return rows;
}

export function createStandardSetup(
  formations: Record<Side, Formation> = { cho: "마상상마", han: "마상상마" },
  turn: Side = "cho",
): Setup {
  return { board: createStandardBoard(formations), turn, formations, handicap: false };
}

/**
 * GIB `[판 "..."]` 표기를 해석한다.
 *
 * `행/행/.../행 <초|한> 접장기` 꼴이다. 첫 행이 10행(초 진영 끝)이고 마지막이 1행이다.
 * 행 안은 왼쪽(1열)부터 기물 글자 또는 빈칸 개수(숫자)이며, 오른쪽 빈칸은 생략된다.
 * 초 기물은 한글, 한 기물은 한자로 적힌다. 접미사의 진영이 선수다.
 */
export function parseBoardNotation(text: string): Setup {
  const trimmed = text.trim();
  const spaceAt = trimmed.indexOf(" ");
  const rowsText = spaceAt === -1 ? trimmed : trimmed.slice(0, spaceAt);
  const suffix = spaceAt === -1 ? "" : trimmed.slice(spaceAt + 1).trim();
  const rowTexts = rowsText.split("/");
  if (rowTexts.length !== RANKS) {
    throw new SyntaxError(`판 표기는 ${RANKS}행이어야 합니다 (${rowTexts.length}행): ${text}`);
  }
  const rows = emptyRows();
  rowTexts.forEach((rowText, i) => {
    const rank = RANKS - i;
    let file = 1;
    for (const ch of rowText) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const type = pieceTypeFromChar(ch);
      if (!type) throw new SyntaxError(`판 표기에 모르는 글자가 있습니다: ${ch}`);
      if (file > FILES) throw new SyntaxError(`판 표기의 행이 ${FILES}칸을 넘습니다: ${rowText}`);
      rows[rank - 1][file - 1] = { side: isHangulPieceChar(ch) ? "cho" : "han", type };
      file += 1;
    }
    if (file > FILES + 1) throw new SyntaxError(`판 표기의 행이 ${FILES}칸을 넘습니다: ${rowText}`);
  });
  const turn = sideFromChar(suffix.charAt(0)) ?? "cho";
  return { board: rows, turn, handicap: true };
}

/** `parseBoardNotation`의 역. 표준 배치도 접장기 표기로 직렬화된다. */
export function formatBoardNotation(setup: Setup): string {
  const rowTexts: string[] = [];
  for (let rank = RANKS; rank >= 1; rank--) {
    let out = "";
    let empty = 0;
    for (let file = 1; file <= FILES; file++) {
      const piece = setup.board[rank - 1][file - 1];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty > 0) out += String(empty);
      empty = 0;
      out += piece.side === "cho" ? hangulChar(piece.type, "cho") : hanjaChar(piece.type, "han");
    }
    rowTexts.push(out);
  }
  return `${rowTexts.join("/")} ${setup.turn === "cho" ? "초" : "한"} 접장기`;
}

export class ReplayError extends Error {
  constructor(
    message: string,
    /** 문제가 난 수의 번호(1부터). */
    readonly ply?: number,
  ) {
    super(message);
    this.name = "ReplayError";
  }
}

/**
 * 한 수를 적용한 새 판을 돌려준다. 원본은 바뀌지 않는다.
 * 출발칸의 기물이나 잡은 기물이 기보와 다르면 `ReplayError`를 던진다.
 * 합법수 여부는 검사하지 않는다.
 */
export function applyPly(board: Board, ply: Ply): Board {
  if (ply.kind === "pass") return board;
  const { from, to, side, piece, captured } = ply;
  if (!isOnBoard(from) || !isOnBoard(to)) {
    throw new ReplayError(`판 밖으로 움직이는 수입니다: ${from.rank},${from.file} → ${to.rank},${to.file}`);
  }
  const src = getPiece(board, from);
  if (!src || src.side !== side || src.type !== piece) {
    throw new ReplayError(
      `출발칸 ${from.rank},${from.file}에 ${side} ${piece}가 없습니다 (실제: ${
        src ? `${src.side} ${src.type}` : "빈칸"
      })`,
    );
  }
  const dst = getPiece(board, to);
  if (captured) {
    if (!dst || dst.side === side || dst.type !== captured) {
      throw new ReplayError(
        `도착칸 ${to.rank},${to.file}에 잡을 ${captured}가 없습니다 (실제: ${
          dst ? `${dst.side} ${dst.type}` : "빈칸"
        })`,
      );
    }
  } else if (dst) {
    throw new ReplayError(
      `도착칸 ${to.rank},${to.file}에 기물(${dst.side} ${dst.type})이 있는데 잡은 표기가 없습니다`,
    );
  }
  const rows = board.map((row) => [...row]);
  rows[from.rank - 1][from.file - 1] = null;
  rows[to.rank - 1][to.file - 1] = src;
  return rows;
}
