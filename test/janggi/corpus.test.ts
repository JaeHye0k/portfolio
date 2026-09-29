/**
 * 로컬 기보 코퍼스 전수 재생 테스트.
 * `JANGGI_CORPUS_DIR`(기본 `~/Downloads/카카오장기기보`)에 .gib 파일이 있을 때만 실행된다.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createReplay, decodeGib, formatBoardNotation, parseGib, serializeGib } from "@/lib/janggi";

const dir = process.env.JANGGI_CORPUS_DIR ?? path.join(os.homedir(), "Downloads", "카카오장기기보");
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".gib")) : [];

describe.skipIf(files.length === 0)(`corpus: ${dir}`, () => {
  it("parses and replays every game without integrity errors", () => {
    let games = 0;
    let plies = 0;
    for (const file of files) {
      const records = parseGib(decodeGib(readFileSync(path.join(dir, file))));
      for (const record of records) {
        const replay = createReplay(record);
        expect(replay.error, `${file}: ${record.meta.players.cho.name} vs ${record.meta.players.han.name}`).toBeUndefined();
        expect(String(record.plies.length)).toBe(record.meta.tags["총수"]);
        if (record.meta.tags["판"]) expect(formatBoardNotation(record.setup)).toBe(record.meta.tags["판"]);
        games += 1;
        plies += record.plies.length;
      }
    }
    expect(games).toBeGreaterThan(0);
    expect(plies).toBeGreaterThan(games);
  });

  it("survives a serialize → parse round trip", () => {
    const records = parseGib(decodeGib(readFileSync(path.join(dir, files[0]))));
    const again = parseGib(serializeGib(records));
    expect(again.map((r) => r.plies)).toEqual(records.map((r) => r.plies));
    expect(again.map((r) => r.setup)).toEqual(records.map((r) => r.setup));
  });
});
