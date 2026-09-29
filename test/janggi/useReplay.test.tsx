import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReplay } from "@/components/janggi/useReplay";
import { parseGib } from "@/lib/janggi";
import { KAKAO_GAME } from "./fixtures";

const record = parseGib(KAKAO_GAME)[0];

describe("useReplay autoplay", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("advances one ply per interval and stops at the end", () => {
    const { result } = renderHook(() => useReplay(record, { initialPly: 9, intervalMs: 100 }));
    act(() => result.current.play());
    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.ply).toBe(10);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.ply).toBe(11);
    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.ply).toBe(12);
    expect(result.current.playing).toBe(false);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.ply).toBe(12);
  });

  it("restarts from the beginning when played at the end", () => {
    const { result } = renderHook(() => useReplay(record, { intervalMs: 100 }));
    act(() => result.current.last());
    act(() => result.current.play());
    expect(result.current.ply).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.ply).toBe(1);
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.ply).toBe(1);
  });
});
