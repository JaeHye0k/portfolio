import { ChevronLeft, ChevronRight, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { ReplayController } from "./useReplay";

export type ReplayControlsProps = {
  controller: ReplayController;
  className?: string;
};

const SPEEDS = [
  { label: "0.3초", ms: 300 },
  { label: "0.5초", ms: 500 },
  { label: "0.8초", ms: 800 },
  { label: "1.5초", ms: 1500 },
  { label: "3초", ms: 3000 },
];

const btn =
  "inline-flex h-9 w-9 items-center justify-center border border-divider bg-surface text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-divider disabled:hover:text-ink";

export default function ReplayControls({ controller, className }: ReplayControlsProps) {
  const { ply, length, atStart, atEnd, first, prev, next, last, playing, toggle, intervalMs, setIntervalMs } =
    controller;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <button type="button" className={btn} onClick={first} disabled={atStart} aria-label="처음으로">
        <SkipBack size={16} />
      </button>
      <button type="button" className={btn} onClick={prev} disabled={atStart} aria-label="이전 수">
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        className={`${btn} border-accent text-accent`}
        onClick={toggle}
        disabled={length === 0}
        aria-label={playing ? "일시정지" : "재생"}
        aria-pressed={playing}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button type="button" className={btn} onClick={next} disabled={atEnd} aria-label="다음 수">
        <ChevronRight size={18} />
      </button>
      <button type="button" className={btn} onClick={last} disabled={atEnd} aria-label="마지막으로">
        <SkipForward size={16} />
      </button>
      <span className="ml-1 font-mono text-[13px] tabular-nums" aria-live="polite" aria-label="현재 수">
        {ply} / {length}
      </span>
      <label className="ml-auto flex items-center gap-1 text-[12px] text-neutral-700">
        속도
        <select
          value={intervalMs}
          onChange={(e) => setIntervalMs(Number(e.target.value))}
          className="border border-divider bg-surface px-1 py-1 text-[12px]"
        >
          {SPEEDS.map((s) => (
            <option key={s.ms} value={s.ms}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
