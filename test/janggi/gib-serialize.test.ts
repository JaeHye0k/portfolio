import { describe, expect, it } from "vitest";
import { gibSerializer, parseGib, serializeGame, serializeGib } from "@/lib/janggi";
import type { GameRecord } from "@/lib/janggi";
import { COMMENTED_GAME, MULTI_GAME_FILE } from "./fixtures";

function comparable(record: GameRecord) {
  const { tags: _tags, ...meta } = record.meta;
  void _tags;
  return { meta, setup: record.setup, plies: record.plies, comments: record.comments };
}

describe("serializeGib", () => {
  it("round-trips games, including handicap setups and passes", () => {
    const original = parseGib(MULTI_GAME_FILE);
    const text = serializeGib(original);
    const again = parseGib(text);
    expect(again.map(comparable)).toEqual(original.map(comparable));
    expect(text).toContain('[판 "차마상사1사상1차/');
    expect(text).toContain("16. 한수쉼");
    expect(text).toContain('[총수 "18"]');
  });

  it("round-trips comments at every position", () => {
    const [original] = parseGib(COMMENTED_GAME);
    const text = serializeGame(original);
    expect(text).toContain("{시작 전 주석}");
    const [again] = parseGib(text);
    expect(again.comments).toEqual(original.comments);
  });

  it("writes kakao-style moves six per line", () => {
    const [record] = parseGib(MULTI_GAME_FILE);
    const lines = serializeGame(record).split("\r\n");
    expect(lines).toContain("1. 71楚卒72 2. 49漢兵48 3. 08楚馬87 4. 18漢馬37 5. 88楚包85 6. 38漢包35");
    expect(gibSerializer.format).toBe("gib");
  });
});
