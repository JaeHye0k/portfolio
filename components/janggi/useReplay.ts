import { useCallback, useEffect, useMemo, useState } from "react";
import { clampPly, createReplay } from "@/lib/janggi";
import type { GameRecord, Replay, ReplayFrame } from "@/lib/janggi";

export type UseReplayOptions = {
  initialPly?: number;
  /** 자동 재생 간격(ms). */
  intervalMs?: number;
};

export type ReplayController = {
  replay: Replay;
  frame: ReplayFrame;
  ply: number;
  length: number;
  atStart: boolean;
  atEnd: boolean;
  goTo: (ply: number) => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  intervalMs: number;
  setIntervalMs: (ms: number) => void;
};

/**
 * 기보 재생 상태. `record`가 바뀌면 처음 위치로 돌아간다.
 * 게임 화면에서는 진행 중인 `GameRecord`를 그대로 넘겨 복기용으로 쓸 수 있다.
 */
export function useReplay(record: GameRecord, options: UseReplayOptions = {}): ReplayController {
  const replay = useMemo(() => createReplay(record), [record]);
  const [state, setState] = useState(() => ({ replay, ply: clampPly(replay, options.initialPly ?? 0) }));
  const [playing, setPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(options.intervalMs ?? 800);

  // record가 바뀌면 렌더 중에 상태를 맞춘다 (React의 "adjusting state on prop change" 패턴).
  if (state.replay !== replay) {
    setState({ replay, ply: clampPly(replay, options.initialPly ?? 0) });
  }
  const ply = state.replay === replay ? state.ply : clampPly(replay, options.initialPly ?? 0);

  const goTo = useCallback(
    (target: number) => setState((s) => ({ replay: s.replay, ply: clampPly(s.replay, target) })),
    [],
  );
  const next = useCallback(() => setState((s) => ({ replay: s.replay, ply: clampPly(s.replay, s.ply + 1) })), []);
  const prev = useCallback(() => setState((s) => ({ replay: s.replay, ply: clampPly(s.replay, s.ply - 1) })), []);
  const first = useCallback(() => goTo(0), [goTo]);
  const last = useCallback(() => setState((s) => ({ replay: s.replay, ply: s.replay.length })), []);

  // 자동 재생: 한 수마다 타이머를 새로 건다. 마지막 수에 닿으면 멈춘다.
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (ply + 1 >= replay.length) setPlaying(false);
      goTo(ply + 1);
    }, intervalMs);
    return () => clearTimeout(id);
  }, [playing, ply, intervalMs, replay.length, goTo]);

  const play = useCallback(() => {
    if (ply >= replay.length) goTo(0);
    setPlaying(true);
  }, [goTo, ply, replay.length]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  return {
    replay,
    frame: replay.frames[ply],
    ply,
    length: replay.length,
    atStart: ply === 0,
    atEnd: ply >= replay.length,
    goTo,
    next,
    prev,
    first,
    last,
    playing,
    play,
    pause,
    toggle,
    intervalMs,
    setIntervalMs,
  };
}
