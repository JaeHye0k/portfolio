/**
 * 장기 기보 코어. React나 Next.js에 의존하지 않는다.
 *
 * - 도메인 모델: `GameRecord`, `Ply`, `Board`, `Setup` (types.ts)
 * - 배치와 수 적용: `createStandardSetup`, `applyPly`, `parseBoardNotation`
 * - 재생: `createReplay`
 * - GIB 형식: `decodeGib`, `parseGib`, `serializeGib`, `gibParser`, `gibSerializer`
 */
export * from "./types";
export * from "./pieces";
export * from "./board";
export * from "./replay";
export * from "./notation";
export * from "./gib";
