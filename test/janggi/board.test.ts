import { describe, expect, it } from "vitest";
import {
  applyPly,
  createBoard,
  createStandardBoard,
  createStandardSetup,
  formatBoardNotation,
  getPiece,
  parseBoardNotation,
  ReplayError,
} from "@/lib/janggi";
import type { Board, MovePly } from "@/lib/janggi";
import { HANDICAP_PAN } from "./fixtures";

function count(board: Board): number {
  return board.flat().filter(Boolean).length;
}

describe("createStandardBoard", () => {
  it("places 16 pieces per side with cannons on rank 3/8 and kings on rank 2/9", () => {
    const board = createStandardBoard({ cho: "마상상마", han: "상마상마" });
    expect(count(board)).toBe(32);
    expect(getPiece(board, { rank: 9, file: 5 })).toEqual({ side: "cho", type: "king" });
    expect(getPiece(board, { rank: 2, file: 5 })).toEqual({ side: "han", type: "king" });
    expect(getPiece(board, { rank: 8, file: 2 })).toEqual({ side: "cho", type: "cannon" });
    expect(getPiece(board, { rank: 3, file: 8 })).toEqual({ side: "han", type: "cannon" });
    expect(getPiece(board, { rank: 7, file: 9 })).toEqual({ side: "cho", type: "soldier" });
    expect(getPiece(board, { rank: 4, file: 1 })).toEqual({ side: "han", type: "soldier" });
    expect(getPiece(board, { rank: 5, file: 5 })).toBeNull();
  });

  it("reads formations left to right from cho's side for both players", () => {
    const board = createStandardBoard({ cho: "마상상마", han: "상마상마" });
    expect(getPiece(board, { rank: 10, file: 2 })?.type).toBe("horse");
    expect(getPiece(board, { rank: 10, file: 3 })?.type).toBe("elephant");
    expect(getPiece(board, { rank: 1, file: 2 })?.type).toBe("elephant");
    expect(getPiece(board, { rank: 1, file: 3 })?.type).toBe("horse");
    expect(getPiece(board, { rank: 1, file: 8 })?.type).toBe("horse");
  });
});

describe("parseBoardNotation", () => {
  it("parses the handicap layout: first row is rank 10, trailing empties are omitted", () => {
    const setup = parseBoardNotation(HANDICAP_PAN);
    expect(setup.turn).toBe("han");
    expect(setup.handicap).toBe(true);
    expect(setup.formations).toBeUndefined();
    expect(count(setup.board)).toBe(32);
    expect(getPiece(setup.board, { rank: 10, file: 1 })).toEqual({ side: "cho", type: "chariot" });
    expect(getPiece(setup.board, { rank: 10, file: 8 })).toBeNull();
    expect(getPiece(setup.board, { rank: 8, file: 7 })).toEqual({ side: "cho", type: "horse" });
    expect(getPiece(setup.board, { rank: 9, file: 5 })).toEqual({ side: "cho", type: "king" });
    expect(getPiece(setup.board, { rank: 7, file: 8 })).toEqual({ side: "cho", type: "soldier" });
    expect(getPiece(setup.board, { rank: 7, file: 9 })).toBeNull();
    expect(getPiece(setup.board, { rank: 1, file: 2 })).toEqual({ side: "han", type: "horse" });
    expect(getPiece(setup.board, { rank: 3, file: 7 })).toEqual({ side: "han", type: "horse" });
  });

  it("round-trips through formatBoardNotation", () => {
    expect(formatBoardNotation(parseBoardNotation(HANDICAP_PAN))).toBe(HANDICAP_PAN);
    const cho = "차1상사1사상1차/4장/2마1포1마포/졸1졸1졸1졸졸///1兵兵1兵1兵1兵/1包2包1馬/4將/車象馬士1士象1車 초 접장기";
    expect(formatBoardNotation(parseBoardNotation(cho))).toBe(cho);
  });

  it("serializes the standard setup", () => {
    const text = formatBoardNotation(createStandardSetup({ cho: "마상상마", han: "상마상마" }));
    expect(text).toBe("차마상사1사상마차/4장/1포5포/졸1졸1졸1졸1졸///兵1兵1兵1兵1兵/1包5包/4將/車象馬士1士象馬車 초 접장기");
  });

  it("rejects malformed notation", () => {
    expect(() => parseBoardNotation("4장/4將 초 접장기")).toThrow(SyntaxError);
    expect(() => parseBoardNotation("차차차차차차차차차차/////////  초")).toThrow(SyntaxError);
    expect(() => parseBoardNotation("X/////////")).toThrow(SyntaxError);
  });
});

describe("applyPly", () => {
  const board = createBoard([
    { square: { rank: 7, file: 9 }, piece: { side: "cho", type: "soldier" } },
    { square: { rank: 6, file: 9 }, piece: { side: "han", type: "soldier" } },
  ]);
  const move = (over: Partial<MovePly>): MovePly => ({
    kind: "move",
    side: "cho",
    piece: "soldier",
    from: { rank: 7, file: 9 },
    to: { rank: 7, file: 8 },
    check: false,
    ...over,
  });

  it("moves a piece without mutating the original board", () => {
    const next = applyPly(board, move({}));
    expect(getPiece(next, { rank: 7, file: 8 })).toEqual({ side: "cho", type: "soldier" });
    expect(getPiece(next, { rank: 7, file: 9 })).toBeNull();
    expect(getPiece(board, { rank: 7, file: 9 })).toEqual({ side: "cho", type: "soldier" });
  });

  it("captures when the notation says so", () => {
    const next = applyPly(board, move({ to: { rank: 6, file: 9 }, captured: "soldier" }));
    expect(getPiece(next, { rank: 6, file: 9 })).toEqual({ side: "cho", type: "soldier" });
  });

  it("returns the same board for a pass", () => {
    expect(applyPly(board, { kind: "pass", side: "cho" })).toBe(board);
  });

  it("throws ReplayError when the source square or capture disagrees with the board", () => {
    expect(() => applyPly(board, move({ piece: "horse" }))).toThrow(ReplayError);
    expect(() => applyPly(board, move({ side: "han" }))).toThrow(ReplayError);
    expect(() => applyPly(board, move({ to: { rank: 6, file: 9 } }))).toThrow(ReplayError);
    expect(() => applyPly(board, move({ to: { rank: 7, file: 8 }, captured: "soldier" }))).toThrow(ReplayError);
    expect(() => applyPly(board, move({ to: { rank: 7, file: 10 } }))).toThrow(ReplayError);
  });
});
