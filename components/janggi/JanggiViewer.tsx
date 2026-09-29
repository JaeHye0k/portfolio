"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { formatPly, opposite } from "@/lib/janggi";
import type { GameRecord, NotationStyle, Side } from "@/lib/janggi";
import GameInfoPanel from "./GameInfoPanel";
import JanggiBoard from "./JanggiBoard";
import MoveList from "./MoveList";
import ReplayControls from "./ReplayControls";
import { useReplay, type UseReplayOptions } from "./useReplay";

export type JanggiViewerProps = {
  record: GameRecord;
  /** 아래쪽에 놓을 진영. 기본은 초. */
  orientation?: Side;
  initialPly?: number;
  /** 진행 중인 대국을 따라갈지. `useReplay`의 `followTip`. */
  followTip?: UseReplayOptions["followTip"];
  onPlyChange?: (ply: number) => void;
  notation?: NotationStyle;
  /** 창 전체의 방향키·스페이스로 조작할지. 기본 true. 뷰어가 여럿이면 마지막으로 만진 뷰어만 반응한다. */
  keyboard?: boolean;
  className?: string;
};

/** 마지막으로 상호작용한 뷰어. 한 페이지에 뷰어가 여럿일 때 키보드 입력을 하나만 받게 한다. */
let activeViewer: object | null = null;

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

/** 스페이스·엔터를 스스로 처리하는 요소. 여기에 포커스가 있으면 스페이스를 가로채지 않는다. */
function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["BUTTON", "A", "SUMMARY"].includes(target.tagName) || target.getAttribute("role") === "button";
}

/** `GameRecord` 하나를 재생하는 뷰어. 파일 형식은 모른다. */
export default function JanggiViewer({
  record,
  orientation: initialOrientation = "cho",
  initialPly,
  followTip,
  onPlyChange,
  notation = "hangul",
  keyboard = true,
  className,
}: JanggiViewerProps) {
  const controller = useReplay(record, { initialPly, followTip });
  const { frame, ply, goTo, next, prev, first, last, toggle } = controller;
  const [orientation, setOrientation] = useState<Side>(initialOrientation);
  const [token] = useState<object>(() => ({}));

  const onPlyChangeRef = useRef(onPlyChange);
  useEffect(() => {
    onPlyChangeRef.current = onPlyChange;
  }, [onPlyChange]);
  useEffect(() => {
    onPlyChangeRef.current?.(ply);
  }, [ply]);

  useEffect(() => {
    if (activeViewer === null) activeViewer = token;
    return () => {
      if (activeViewer === token) activeViewer = null;
    };
  }, [token]);

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (activeViewer !== null && activeViewer !== token) return;
      if (isEditable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " && isActivatable(e.target)) return;
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
  }, [keyboard, token, next, prev, first, last, toggle]);

  const activate = () => {
    activeViewer = token;
  };

  const comments = record.comments.filter((c) => c.ply === ply);
  const lastPly = frame.lastPly;
  const isCheck = lastPly?.kind === "move" && lastPly.check && !frame.error;
  const status =
    lastPly === null ? "시작 배치" : `${ply}. ${formatPly(lastPly, notation)}${isCheck ? " (장군)" : ""}`;

  return (
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_300px] ${className ?? ""}`}
      onPointerDownCapture={activate}
      onFocusCapture={activate}
    >
      <div className="flex flex-col gap-2">
        <JanggiBoard
          board={frame.board}
          orientation={orientation}
          lastPly={frame.error ? null : lastPly}
          checkedSide={isCheck && lastPly.kind === "move" ? opposite(lastPly.side) : null}
        />
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
