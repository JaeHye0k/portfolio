import { describe, expect, it } from "vitest";
import {
  formatPly,
  GibParseError,
  gibParser,
  parseGib,
  parseMoveToken,
  parsePlayer,
  parseResult,
} from "@/lib/janggi";
import {
  ASSOCIATION_GAME,
  COMMENTED_GAME,
  HANDICAP_GAME,
  HANDICAP_PAN,
  KAKAO_GAME,
  MULTI_GAME_FILE,
  PASS_GAME,
} from "./fixtures";

describe("parseGib: header", () => {
  it("maps tags to meta and keeps the raw tags", () => {
    const [record] = parseGib(ASSOCIATION_GAME);
    expect(record.meta.event).toBe("2023 신인왕전");
    expect(record.meta.round).toBe("결승");
    expect(record.meta.date).toBe("2023-05-14");
    expect(record.meta.site).toBe("(사)대한장기협회 특별대국실");
    expect(record.meta.players.cho).toEqual({ name: "초선수", grade: "4단" });
    expect(record.meta.players.han).toEqual({ name: "한선수", grade: "二段" });
    expect(record.meta.timeControl).toBe("15분 30초 3회");
    expect(record.meta.result).toEqual({ winner: "han", reason: "decisive", raw: "한 완승" });
    expect(record.meta.tags["총수"]).toBe("20");
    expect(record.setup.formations).toEqual({ cho: "마상상마", han: "상마상마" });
    expect(record.setup.handicap).toBe(false);
    expect(record.setup.turn).toBe("cho");
  });

  it("uses the 판 tag for handicap games and lets han move first", () => {
    const [record] = parseGib(HANDICAP_GAME);
    expect(record.setup.handicap).toBe(true);
    expect(record.setup.turn).toBe("han");
    expect(record.meta.tags["판"]).toBe(HANDICAP_PAN);
    expect(record.plies[0]).toMatchObject({ side: "han", piece: "soldier", from: { rank: 4, file: 1 } });
    expect(record.plies[1]).toMatchObject({ side: "cho", piece: "horse" });
  });

  it("rejects an unknown formation", () => {
    expect(() => parseGib(ASSOCIATION_GAME.replace('[초차림 "마상상마"]', '[초차림 "마마마마"]'))).toThrow(
      GibParseError,
    );
  });
});

describe("parseGib: moves", () => {
  it("parses association notation, inferring sides from alternation", () => {
    const [record] = parseGib(ASSOCIATION_GAME);
    expect(record.plies).toHaveLength(20);
    expect(record.plies[0]).toEqual({
      kind: "move",
      side: "cho",
      piece: "soldier",
      from: { rank: 7, file: 9 },
      to: { rank: 7, file: 8 },
      check: false,
    });
    expect(record.plies[1]).toMatchObject({ side: "han", piece: "horse", from: { rank: 1, file: 8 }, to: { rank: 3, file: 7 } });
    expect(record.plies[16]).toMatchObject({ piece: "king", from: { rank: 9, file: 5 }, to: { rank: 10, file: 5 } });
    expect(record.plies[18]).toMatchObject({ piece: "chariot", captured: "chariot", check: true, from: { rank: 10, file: 9 } });
    expect(record.plies[19]).toMatchObject({ side: "han", piece: "horse", captured: "chariot", check: false });
  });

  it("parses kakao notation with explicit sides and hanja pieces", () => {
    const [record] = parseGib(KAKAO_GAME);
    expect(record.plies).toHaveLength(12);
    expect(record.plies[0]).toMatchObject({ side: "cho", piece: "soldier", from: { rank: 7, file: 1 }, to: { rank: 7, file: 2 } });
    expect(record.plies[11]).toMatchObject({ side: "han", piece: "king", from: { rank: 2, file: 5 }, to: { rank: 2, file: 4 } });
    expect(record.meta.result).toEqual({ winner: "cho", reason: "time", raw: "초 시간승" });
  });

  it("parses 한수쉼 as a pass for the side to move", () => {
    const [record] = parseGib(PASS_GAME);
    expect(record.plies[15]).toEqual({ kind: "pass", side: "han" });
    expect(record.plies[16]).toMatchObject({ side: "cho", piece: "chariot" });
  });

  it("collects comments with the ply they follow and ignores the trailing Ctrl-Z", () => {
    const [record] = parseGib(COMMENTED_GAME);
    expect(record.plies).toHaveLength(4);
    expect(record.comments).toEqual([
      { ply: 0, text: "시작 전 주석" },
      { ply: 2, text: "두 수 뒤 주석" },
      { ply: 4, text: "갑자기 楚가 투료" },
    ]);
    expect(record.meta.players.han).toEqual({ name: "미상" });
    expect(record.meta.result).toEqual({ winner: null, reason: "unknown", raw: "미상" });
  });

  it("separates a comment glued to a move", () => {
    const [record] = parseGib(KAKAO_GAME.replace("1. 71楚卒72", "1. 71楚卒72{좋은 수}"));
    expect(record.plies).toHaveLength(12);
    expect(record.comments).toEqual([{ ply: 1, text: "좋은 수" }]);
  });

  it("wraps an out-of-range square in GibParseError", () => {
    let error: unknown;
    try {
      parseGib(KAKAO_GAME.replace("1. 71楚卒72", "1. 70楚卒72"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(GibParseError);
    expect((error as GibParseError).token).toBe("70楚卒72");
  });

  it("accepts a move number glued to the move", () => {
    const [record] = parseGib(KAKAO_GAME.replace("1. 71楚卒72", "1.71楚卒72"));
    expect(record.plies[0]).toMatchObject({ from: { rank: 7, file: 1 } });
  });

  it("reports the game index, move number and token on a bad move", () => {
    const broken = MULTI_GAME_FILE.replace("10. 13漢馬34", "10. 13漢X34");
    let error: unknown;
    try {
      parseGib(broken);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(GibParseError);
    const err = error as GibParseError;
    expect(err.gameIndex).toBe(0);
    expect(err.moveNumber).toBe(10);
    expect(err.token).toBe("13漢X34");
  });
});

describe("parseGib: multiple games", () => {
  it("splits a file into games at each header block", () => {
    const records = parseGib(MULTI_GAME_FILE);
    expect(records).toHaveLength(3);
    expect(records.map((r) => r.plies.length)).toEqual([12, 18, 6]);
    expect(records[2].setup.handicap).toBe(true);
  });

  it("exposes the parser through the GameRecordParser interface", () => {
    expect(gibParser.format).toBe("gib");
    expect(gibParser.parse(MULTI_GAME_FILE)).toHaveLength(3);
  });

  it("handles LF-only input", () => {
    expect(parseGib(MULTI_GAME_FILE.replace(/\r\n/g, "\n"))).toHaveLength(3);
  });
});

describe("parseResult", () => {
  it.each([
    ["한 완승", "han", "decisive"],
    ["초 완슫", "cho", "decisive"],
    ["漢 시간승", "han", "time"],
    ["楚 완승", "cho", "decisive"],
    ["초 점수승(기물승)", "cho", "points"],
    ["한 0.5점 승", "han", "points"],
    ["한 접속 끊김 승", "han", "disconnect"],
    ["미상", null, "unknown"],
  ])("%s → %s / %s", (raw, winner, reason) => {
    expect(parseResult(raw)).toEqual({ winner, reason, raw });
  });
});

describe("parsePlayer", () => {
  it("splits the grade off the name", () => {
    expect(parsePlayer("서 철봉 4단")).toEqual({ name: "서 철봉", grade: "4단" });
    expect(parsePlayer("누군가 9단")).toEqual({ name: "누군가", grade: "9단" });
    expect(parsePlayer("초보 18급")).toEqual({ name: "초보", grade: "18급" });
    expect(parsePlayer("미상")).toEqual({ name: "미상" });
  });
});

describe("parseMoveToken / formatPly", () => {
  it("round-trips both notation styles", () => {
    const ply = parseMoveToken("09차29차장군", "cho")!;
    expect(formatPly(ply, "hangul")).toBe("09차29차장군");
    expect(formatPly(ply, "hanja")).toBe("09楚車29車장군");
    expect(formatPly(parseMoveToken("41漢兵42", "cho")!, "hangul")).toBe("41병42");
    expect(formatPly({ kind: "pass", side: "cho" })).toBe("한수쉼");
    expect(parseMoveToken("nope", "cho")).toBeUndefined();
  });
});
