import { useEffect, useRef } from "react";
import { formatPly } from "@/lib/janggi";
import type { NotationStyle, Ply } from "@/lib/janggi";

export type MoveListProps = {
  plies: readonly Ply[];
  /** 현재 프레임(0 = 시작 배치). */
  current: number;
  onSelect: (ply: number) => void;
  style?: NotationStyle;
  className?: string;
};

const SIDE_TEXT = { cho: "text-[#1b7a3f]", han: "text-[#c0281a]" } as const;

export default function MoveList({ plies, current, onSelect, style = "hangul", className }: MoveListProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>("[data-current='true']");
    el?.scrollIntoView?.({ block: "nearest" });
  }, [current]);

  return (
    <ol
      ref={listRef}
      aria-label="수순"
      className={`grid grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto font-mono text-[13px] ${className ?? ""}`}
    >
      <li className="col-span-2">
        <button
          type="button"
          data-current={current === 0}
          aria-current={current === 0 ? "step" : undefined}
          onClick={() => onSelect(0)}
          className={`w-full px-2 py-0.5 text-left ${current === 0 ? "bg-ink text-ground" : "hover:bg-surface"}`}
        >
          시작 배치
        </button>
      </li>
      {plies.map((ply, i) => {
        const n = i + 1;
        const active = current === n;
        return (
          <li key={n}>
            <button
              type="button"
              data-current={active}
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(n)}
              className={`flex w-full gap-1.5 px-2 py-0.5 text-left ${
                active ? "bg-ink text-ground" : "hover:bg-surface"
              }`}
            >
              <span className="w-8 shrink-0 text-right text-neutral-500">{n}.</span>
              <span className={active ? "" : SIDE_TEXT[ply.side]}>{formatPly(ply, style)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
