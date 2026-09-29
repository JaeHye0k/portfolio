import type { GameRecordParser, GameRecordSerializer } from "../types";
import { parseGib } from "./parse";
import { serializeGib } from "./serialize";

export { decodeGib } from "./decode";
export { GibParseError, parseGib, parseMoveToken, parsePlayer, parseResult } from "./parse";
export { serializeGame, serializeGib } from "./serialize";

export const gibParser: GameRecordParser = { format: "gib", parse: parseGib };
export const gibSerializer: GameRecordSerializer = { format: "gib", serialize: serializeGib };
