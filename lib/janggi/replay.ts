import { applyPly, ReplayError } from "./board";
import { opposite } from "./pieces";
import type { Board, GameRecord, Ply, Side } from "./types";

export type ReplayFrame = {
  /** 이 프레임까지 적용된 수의 개수. 0이면 시작 배치. */
  ply: number;
  board: Board;
  /** 다음에 둘 진영. */
  turn: Side;
  /** 이 프레임을 만든 수. 시작 배치면 null. */
  lastPly: Ply | null;
  /** 기보 무결성 오류. 오류가 난 수부터는 마지막 정상 판이 유지된다. */
  error?: ReplayError;
};

export type Replay = {
  readonly record: GameRecord;
  /** 프레임 개수 - 1. 곧 수의 개수. */
  readonly length: number;
  /** `frames[i]`는 i수까지 둔 상태. */
  readonly frames: readonly ReplayFrame[];
  /** 무결성 오류가 있으면 처음 난 위치. */
  readonly error?: ReplayError;
};

export function clampPly(replay: Replay, ply: number): number {
  if (!Number.isFinite(ply)) return 0;
  return Math.min(Math.max(Math.floor(ply), 0), replay.length);
}

/** 기보의 모든 프레임을 미리 계산한다. 한 대국은 길어야 수백 수라 비용이 작다. */
export function createReplay(record: GameRecord): Replay {
  const frames: ReplayFrame[] = [
    { ply: 0, board: record.setup.board, turn: record.setup.turn, lastPly: null },
  ];
  let firstError: ReplayError | undefined;
  record.plies.forEach((ply, i) => {
    const prev = frames[i];
    if (firstError) {
      frames.push({ ...prev, ply: i + 1, turn: opposite(ply.side), lastPly: ply, error: firstError });
      return;
    }
    try {
      const board = applyPly(prev.board, ply);
      frames.push({ ply: i + 1, board, turn: opposite(ply.side), lastPly: ply });
    } catch (e) {
      const error =
        e instanceof ReplayError
          ? new ReplayError(`${i + 1}수: ${e.message}`, i + 1)
          : new ReplayError(`${i + 1}수: ${String(e)}`, i + 1);
      firstError = error;
      frames.push({ ...prev, ply: i + 1, turn: opposite(ply.side), lastPly: ply, error });
    }
  });
  return { record, length: record.plies.length, frames, error: firstError };
}
