import type { Side } from "@/lib/janggi";

/** 진영 색. SVG와 Tailwind 클래스 양쪽에서 같은 값을 쓴다. */
export const SIDE_COLOR: Record<Side, string> = { cho: "#1b7a3f", han: "#c0281a" };
export const SIDE_TEXT_CLASS: Record<Side, string> = { cho: "text-[#1b7a3f]", han: "text-[#c0281a]" };
export const SIDE_BADGE_CLASS: Record<Side, string> = {
  cho: "bg-[#1b7a3f] text-white",
  han: "bg-[#c0281a] text-white",
};

export const BOARD_COLOR = {
  background: "#e8c88f",
  frame: "#7a5a2a",
  line: "#5a3d16",
  piece: "#f8e9c9",
  marker: "#2b6cb0",
  check: "#c0281a",
} as const;
