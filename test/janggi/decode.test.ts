import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createReplay, decodeGib, parseGib } from "@/lib/janggi";

const SAMPLE = path.resolve(__dirname, "../../public/samples/2023-rookie-final.gib");

describe("decodeGib", () => {
  it("decodes EUC-KR bytes", () => {
    const bytes = new Uint8Array([0x5b, 0xb4, 0xeb, 0xc8, 0xb8, 0xb8, 0xed, 0x20]);
    expect(decodeGib(bytes)).toBe("[대회명 ");
  });

  it("keeps UTF-8 input and strips BOM and Ctrl-Z", () => {
    const bytes = new TextEncoder().encode("﻿[대회명 \"친선\"]");
    expect(decodeGib(bytes.buffer)).toBe('[대회명 "친선"]');
  });

  it("decodes and replays the bundled sample without integrity errors", () => {
    const records = parseGib(decodeGib(readFileSync(SAMPLE)));
    expect(records).toHaveLength(1);
    expect(records[0].meta.event).toBe("2023 신인왕전");
    expect(records[0].plies).toHaveLength(90);
    expect(createReplay(records[0]).error).toBeUndefined();
  });
});
