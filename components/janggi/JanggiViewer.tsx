"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { formatPly } from "@/lib/janggi";
import type { GameRecord, NotationStyle, Side } from "@/lib/janggi";
import GameInfoPanel from "./GameInfoPanel";
import JanggiBoard from "./JanggiBoard";
import MoveList from "./MoveList";
import ReplayControls from "./ReplayControls";
import { useReplay } from "./useReplay";

export type JanggiViewerProps = {
  record: GameRecord;
  /** 아래쪽에 놓을 진영. 기본은 초. */
  orientation?: Side;
  initialPly?: number;
  onPlyChange?: (ply: number) => void;
  notation?: NotationStyle;
  /** 창 전체의 방향키·스페이스로 조작할지. 기본 true. */
  keyboard?: boolean;
  className?: string;
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

/** `GameRecord` 하나를 재생하는 뷰어. 파일 형식은 모른다. */
export default function JanggiViewer({
  record,
  orientation: initialOrientation = "cho",
  initialPly,
  onPlyChange,
  notation = "hangul",
  keyboard = true,
  className,
}: JanggiViewerProps) {
  const controller = useReplay(record, { initialPly });
  const { frame, ply, goTo, next, prev, first, last, toggle } = controller;
  const [orientation, setOrientation] = useState<Side>(initialOrientation);

  useEffect(() => {
    onPlyChange?.(ply);
  }, [ply, onPlyChange]);

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
          next();
          break;
        case "ArrowLeft":
          prev();
          break;
        case "Home":
          first();
          break;
        case "End":
          last();
          break;
        case " ":
          toggle();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, next, prev, first, last, toggle]);

  const comments = record.comments.filter((c) => c.ply === ply);
  const lastPly = frame.lastPly;
  const status =
    lastPly === null
      ? "시작 배치"
      : `${ply}. ${formatPly(lastPly, notation)}${lastPly.kind === "move" && lastPly.check ? " (장군)" : ""}`;

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_300px] ${className ?? ""}`}>
      <div className="flex flex-col gap-2">
        <JanggiBoard board={frame.board} orientation={orientation} lastPly={frame.error ? null : lastPly} />
        <div className="flex items-start justify-between gap-2 text-[13px]">
          <p aria-live="polite" className="font-mono">
            {status}
            <span className="ml-2 text-neutral-600">{frame.turn === "cho" ? "초 차례" : "한 차례"}</span>
          </p>
          <button
            type="button"
            onClick={() => setOrientation((o) => (o === "cho" ? "han" : "cho"))}
            className="inline-flex items-center gap-1 text-[12px] text-neutral-700 hover:text-accent"
            aria-label="판 뒤집기"
          >
            <RefreshCw size={13} /> 뒤집기
          </button>
        </div>
        {frame.error && (
          <p role="alert" className="border border-accent bg-accent-100 px-3 py-2 text-[13px] text-accent-800">
            기보 오류: {frame.error.message}
          </p>
        )}
        {comments.map((c, i) => (
          <p key={i} className="border-l-2 border-divider bg-surface px-3 py-2 text-[13px] text-neutral-800">
            {c.text}
          </p>
        ))}
      </div>
      <div className="flex min-h-0 flex-col gap-3">
        <GameInfoPanel meta={record.meta} setup={record.setup} />
        <ReplayControls controller={controller} />
        <MoveList plies={record.plies} current={ply} onSelect={goTo} style={notation} className="max-h-[420px]" />
      </div>
    </div>
  );
}
