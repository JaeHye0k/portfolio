import { describe, expect, it } from "vitest";
import { clampPly, createReplay, getPiece, parseGib } from "@/lib/janggi";
import type { GameRecord } from "@/lib/janggi";
import { ASSOCIATION_GAME, PASS_GAME } from "./fixtures";

describe("createReplay", () => {
  it("builds one frame per ply plus the initial position", () => {
    const [record] = parseGib(ASSOCIATION_GAME);
    const replay = createReplay(record);
    expect(replay.length).toBe(20);
    expect(replay.frames).toHaveLength(21);
    expect(replay.error).toBeUndefined();
    expect(replay.frames[0].board).toBe(record.setup.board);
    expect(replay.frames[0].turn).toBe("cho");
    expect(replay.frames[1].turn).toBe("han");
    expect(replay.frames[1].lastPly).toBe(record.plies[0]);
    // 19. 09차29차장군: 초 차가 한 차를 잡는다
    expect(getPiece(replay.frames[19].board, { rank: 2, file: 9 })).toEqual({ side: "cho", type: "chariot" });
    expect(getPiece(replay.frames[19].board, { rank: 10, file: 9 })).toBeNull();
    // 20. 37마29차: 한 마가 되잡는다
    expect(getPiece(replay.frames[20].board, { rank: 2, file: 9 })).toEqual({ side: "han", type: "horse" });
  });

  it("keeps the board and flips the turn on a pass", () => {
    const [record] = parseGib(PASS_GAME);
    const replay = createReplay(record);
    expect(replay.error).toBeUndefined();
    expect(replay.frames[16].lastPly).toEqual({ kind: "pass", side: "han" });
    expect(replay.frames[16].board).toBe(replay.frames[15].board);
    expect(replay.frames[16].turn).toBe("cho");
  });

  it("marks frames from the first inconsistent ply and keeps the last good board", () => {
    const [parsed] = parseGib(ASSOCIATION_GAME);
    const record: GameRecord = {
      ...parsed,
      plies: [
        parsed.plies[0],
        { kind: "move", side: "han", piece: "chariot", from: { rank: 5, file: 5 }, to: { rank: 5, file: 6 }, check: false },
        parsed.plies[1],
      ],
    };
    const replay = createReplay(record);
    expect(replay.error?.ply).toBe(2);
    expect(replay.frames[1].error).toBeUndefined();
    expect(replay.frames[2].error?.ply).toBe(2);
    expect(replay.frames[3].error?.ply).toBe(2);
    expect(replay.frames[3].board).toBe(replay.frames[1].board);
    // 차례는 기보의 수 순서를 계속 따른다
    expect(replay.frames[2].turn).toBe("cho");
    expect(replay.frames[3].turn).toBe("cho");
  });

  it("clamps ply indexes", () => {
    const replay = createReplay(parseGib(ASSOCIATION_GAME)[0]);
    expect(clampPly(replay, -3)).toBe(0);
    expect(clampPly(replay, 7.9)).toBe(7);
    expect(clampPly(replay, 99)).toBe(20);
    expect(clampPly(replay, Number.NaN)).toBe(0);
    expect(clampPly(replay, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
