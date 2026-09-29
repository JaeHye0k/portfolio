"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clampPly, createReplay } from "@/lib/janggi";
import type { GameRecord, Replay, ReplayFrame } from "@/lib/janggi";

export type UseReplayOptions = {
  initialPly?: number;
  /** 자동 재생 간격(ms). */
  intervalMs?: number;
  /**
   * 진행 중인 대국을 따라갈지. `record`가 바뀌었을 때
   * - true: 끝을 보고 있었으면 새 끝으로, 아니면 보던 위치를 유지한다 (게임 화면용).
   * - false(기본): `initialPly`로 돌아간다 (다른 기보를 연 경우).
   */
  followTip?: boolean;
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

type State = { replay: Replay; ply: number };

/** 기보 재생 상태. */
export function useReplay(record: GameRecord, options: UseReplayOptions = {}): ReplayController {
  const { initialPly = 0, followTip = false } = options;
  const replay = useMemo(() => createReplay(record), [record]);
  const [state, setState] = useState<State>(() => ({ replay, ply: clampPly(replay, initialPly) }));
  const [playing, setPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(options.intervalMs ?? 800);

  // record가 바뀌면 렌더 중에 상태를 맞춘다. React가 이 렌더를 버리고 새 상태로 다시 그리지만,
  // 이 렌더도 예외 없이 끝나야 하므로 새 ply를 여기서도 쓴다.
  let ply = state.ply;
  if (state.replay !== replay) {
    const wasAtTip = state.ply >= state.replay.length;
    ply = followTip
      ? wasAtTip
        ? replay.length
        : clampPly(replay, state.ply)
      : clampPly(replay, initialPly);
    setState({ replay, ply });
  }

  const goTo = useCallback((target: number) => setState((s) => ({ replay: s.replay, ply: clampPly(s.replay, target) })), []);
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
