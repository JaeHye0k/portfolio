import type { GameMeta, Setup, Side } from "@/lib/janggi";
import { SIDE_BADGE_CLASS } from "./theme";

export type GameInfoPanelProps = {
  meta: GameMeta;
  setup: Setup;
  className?: string;
};

function PlayerRow({ side, meta, setup }: { side: Side; meta: GameMeta; setup: Setup }) {
  const player = meta.players[side];
  const isWinner = meta.result.winner === side;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center text-[12px] font-bold ${SIDE_BADGE_CLASS[side]}`}
      >
        {side === "cho" ? "楚" : "漢"}
      </span>
      <span className="font-semibold">{player.name || "미상"}</span>
      {player.grade && <span className="text-neutral-600">{player.grade}</span>}
      {setup.formations && <span className="text-[12px] text-neutral-500">{setup.formations[side]}</span>}
      {isWinner && <span className="text-[12px] font-semibold text-accent">승</span>}
    </div>
  );
}

export default function GameInfoPanel({ meta, setup, className }: GameInfoPanelProps) {
  const title = [meta.event, meta.round].filter((s) => s && s !== "미상").join(" · ") || "대국";
  const details = [
    meta.date && meta.date !== "미상" ? meta.date : null,
    meta.site && meta.site !== "미상" ? meta.site : null,
    meta.timeControl && meta.timeControl !== "미상" ? `제한시간 ${meta.timeControl}` : null,
  ].filter(Boolean);
  return (
    <section className={`flex flex-col gap-2 ${className ?? ""}`} aria-label="대국 정보">
      <h2 className="text-[15px]">{title}</h2>
      {details.length > 0 && <p className="text-[12px] text-neutral-600">{details.join(" · ")}</p>}
      <div className="flex flex-col gap-1">
        <PlayerRow side="han" meta={meta} setup={setup} />
        <PlayerRow side="cho" meta={meta} setup={setup} />
      </div>
      <p className="text-[13px]">
        <span className="text-neutral-600">결과 </span>
        <span className="font-semibold">{meta.result.raw || "미상"}</span>
        {setup.handicap && <span className="ml-2 text-[12px] text-neutral-600">접장기</span>}
      </p>
    </section>
  );
}
