import { FILES, RANKS, pieceGlyph, sameSquare } from "@/lib/janggi";
import type { Board, Piece, Ply, Side, Square } from "@/lib/janggi";

export type JanggiBoardProps = {
  board: Board;
  /** 아래쪽에 놓을 진영. 기본은 초. */
  orientation?: Side;
  /** 출발·도착칸을 강조할 수. */
  lastPly?: Ply | null;
  /** 추가로 표시할 칸(게임에서 이동 가능 칸 등). */
  highlights?: readonly Square[];
  /** 선택된 칸(게임에서 집은 기물). */
  selected?: Square | null;
  onSquareClick?: (square: Square, piece: Piece | null) => void;
  showCoordinates?: boolean;
  className?: string;
};

const UNIT = 60;
const MARGIN = 44;
const WIDTH = (FILES - 1) * UNIT + MARGIN * 2;
const HEIGHT = (RANKS - 1) * UNIT + MARGIN * 2;
const PIECE_R = 25;

const SIDE_COLOR: Record<Side, string> = { cho: "#1b7a3f", han: "#c0281a" };

function point(square: Square, orientation: Side): { x: number; y: number } {
  const file = orientation === "cho" ? square.file : FILES + 1 - square.file;
  const rank = orientation === "cho" ? square.rank : RANKS + 1 - square.rank;
  return { x: MARGIN + (file - 1) * UNIT, y: MARGIN + (rank - 1) * UNIT };
}

function octagon(cx: number, cy: number, r: number): string {
  const k = r * Math.tan(Math.PI / 8);
  return [
    [cx - k, cy - r],
    [cx + k, cy - r],
    [cx + r, cy - k],
    [cx + r, cy + k],
    [cx + k, cy + r],
    [cx - k, cy + r],
    [cx - r, cy + k],
    [cx - r, cy - k],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

/** SVG 장기판. 표시 전용이며 상태를 갖지 않는다. */
export default function JanggiBoard({
  board,
  orientation = "cho",
  lastPly,
  highlights = [],
  selected,
  onSquareClick,
  showCoordinates = true,
  className,
}: JanggiBoardProps) {
  const from = lastPly?.kind === "move" ? lastPly.from : null;
  const to = lastPly?.kind === "move" ? lastPly.to : null;
  const lines: string[] = [];
  for (let rank = 1; rank <= RANKS; rank++) {
    const a = point({ rank, file: 1 }, "cho");
    const b = point({ rank, file: FILES }, "cho");
    lines.push(`M${a.x},${a.y}H${b.x}`);
  }
  for (let file = 1; file <= FILES; file++) {
    const a = point({ rank: 1, file }, "cho");
    const b = point({ rank: RANKS, file }, "cho");
    lines.push(`M${a.x},${a.y}V${b.y}`);
  }
  for (const top of [1, 8]) {
    const tl = point({ rank: top, file: 4 }, "cho");
    const br = point({ rank: top + 2, file: 6 }, "cho");
    lines.push(`M${tl.x},${tl.y}L${br.x},${br.y}`, `M${br.x},${tl.y}L${tl.x},${br.y}`);
  }

  const squares: Square[] = [];
  for (let rank = 1; rank <= RANKS; rank++) for (let file = 1; file <= FILES; file++) squares.push({ rank, file });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="장기판"
      className={className}
      style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#e8c88f" />
      <rect
        x={MARGIN - 8}
        y={MARGIN - 8}
        width={(FILES - 1) * UNIT + 16}
        height={(RANKS - 1) * UNIT + 16}
        fill="none"
        stroke="#7a5a2a"
        strokeWidth={3}
      />
      <path d={lines.join(" ")} stroke="#5a3d16" strokeWidth={1.5} fill="none" />

      {showCoordinates &&
        Array.from({ length: FILES }, (_, i) => i + 1).map((file) => {
          const p = point({ rank: RANKS, file }, orientation);
          return (
            <text key={`f${file}`} x={p.x} y={HEIGHT - 12} fontSize={13} textAnchor="middle" fill="#7a5a2a">
              {file}
            </text>
          );
        })}
      {showCoordinates &&
        Array.from({ length: RANKS }, (_, i) => i + 1).map((rank) => {
          const p = point({ rank, file: 1 }, orientation);
          return (
            <text key={`r${rank}`} x={14} y={p.y + 4} fontSize={13} textAnchor="middle" fill="#7a5a2a">
              {rank === 10 ? 0 : rank}
            </text>
          );
        })}

      {from && (
        <circle
          data-marker="from"
          cx={point(from, orientation).x}
          cy={point(from, orientation).y}
          r={10}
          fill="none"
          stroke="#2b6cb0"
          strokeWidth={3}
          opacity={0.8}
        />
      )}
      {highlights.map((sq) => (
        <circle
          key={`h${sq.rank}-${sq.file}`}
          data-marker="highlight"
          cx={point(sq, orientation).x}
          cy={point(sq, orientation).y}
          r={8}
          fill="#2b6cb0"
          opacity={0.45}
        />
      ))}

      {squares.map((sq) => {
        const piece = board[sq.rank - 1][sq.file - 1];
        const { x, y } = point(sq, orientation);
        const isTo = to ? sameSquare(sq, to) : false;
        const isSelected = selected ? sameSquare(sq, selected) : false;
        const clickable = !!onSquareClick;
        return (
          <g
            key={`${sq.rank}-${sq.file}`}
            onClick={clickable ? () => onSquareClick(sq, piece) : undefined}
            style={clickable ? { cursor: "pointer" } : undefined}
            data-square={`${sq.rank}-${sq.file}`}
          >
            {clickable && !piece && <circle cx={x} cy={y} r={PIECE_R} fill="transparent" />}
            {piece && (
              <>
                <polygon
                  points={octagon(x, y, piece.type === "king" ? PIECE_R + 3 : PIECE_R)}
                  fill="#f8e9c9"
                  stroke={SIDE_COLOR[piece.side]}
                  strokeWidth={isTo || isSelected ? 4 : 2}
                />
                <text
                  x={x}
                  y={y + 1}
                  fontSize={piece.type === "king" ? 30 : 26}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={SIDE_COLOR[piece.side]}
                  style={{ fontFamily: '"Noto Serif KR", "Apple SD Gothic Neo", serif' }}
                >
                  {pieceGlyph(piece)}
                </text>
              </>
            )}
            {(isTo || isSelected) && (
              <circle cx={x} cy={y} r={PIECE_R + 6} fill="none" stroke="#2b6cb0" strokeWidth={3} opacity={0.9} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
