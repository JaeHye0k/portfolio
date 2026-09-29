import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JanggiViewer from "@/components/janggi/JanggiViewer";
import JanggiBoard from "@/components/janggi/JanggiBoard";
import { createStandardSetup, parseGib } from "@/lib/janggi";
import { ASSOCIATION_GAME, COMMENTED_GAME, HANDICAP_GAME } from "./fixtures";

const record = parseGib(ASSOCIATION_GAME)[0];

function counter() {
  return screen.getByLabelText("현재 수");
}

describe("JanggiViewer", () => {
  it("renders the game info, board and full move list at the initial position", () => {
    render(<JanggiViewer record={record} />);
    expect(screen.getByRole("img", { name: "장기판" })).toBeInTheDocument();
    expect(screen.getByText("2023 신인왕전 · 결승")).toBeInTheDocument();
    expect(screen.getByText("초선수")).toBeInTheDocument();
    expect(counter()).toHaveTextContent("0 / 20");
    const list = screen.getByRole("list", { name: "수순" });
    expect(within(list).getAllByRole("button")).toHaveLength(21);
    expect(within(list).getByText("09차29차장군")).toBeInTheDocument();
  });

  it("steps with the buttons and disables them at the ends", async () => {
    const user = userEvent.setup();
    const onPlyChange = vi.fn();
    render(<JanggiViewer record={record} onPlyChange={onPlyChange} />);
    expect(screen.getByRole("button", { name: "이전 수" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "다음 수" }));
    expect(counter()).toHaveTextContent("1 / 20");
    expect(onPlyChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole("button", { name: "마지막으로" }));
    expect(counter()).toHaveTextContent("20 / 20");
    expect(screen.getByRole("button", { name: "다음 수" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "처음으로" }));
    expect(counter()).toHaveTextContent("0 / 20");
  });

  it("jumps when a move in the list is clicked and shows the check marker", async () => {
    const user = userEvent.setup();
    render(<JanggiViewer record={record} />);
    await user.click(screen.getByRole("button", { name: /09차29차장군/ }));
    expect(counter()).toHaveTextContent("19 / 20");
    expect(screen.getByText(/19\. 09차29차장군 \(장군\)/)).toBeInTheDocument();
  });

  it("responds to keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<JanggiViewer record={record} />);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(counter()).toHaveTextContent("2 / 20");
    await user.keyboard("{ArrowLeft}");
    expect(counter()).toHaveTextContent("1 / 20");
    await user.keyboard("{End}");
    expect(counter()).toHaveTextContent("20 / 20");
    await user.keyboard("{Home}");
    expect(counter()).toHaveTextContent("0 / 20");
  });

  it("shows the comment attached to the current ply", async () => {
    const user = userEvent.setup();
    render(<JanggiViewer record={parseGib(COMMENTED_GAME)[0]} />);
    expect(screen.getByText("시작 전 주석")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다음 수" }));
    await user.click(screen.getByRole("button", { name: "다음 수" }));
    expect(screen.getByText("두 수 뒤 주석")).toBeInTheDocument();
    expect(screen.queryByText("시작 전 주석")).not.toBeInTheDocument();
  });

  it("starts with han to move in a handicap game", () => {
    render(<JanggiViewer record={parseGib(HANDICAP_GAME)[0]} />);
    expect(screen.getByText("한 차례")).toBeInTheDocument();
    expect(screen.getByText("접장기")).toBeInTheDocument();
  });

  it("resets to the start when the record changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<JanggiViewer record={record} />);
    await user.click(screen.getByRole("button", { name: "마지막으로" }));
    rerender(<JanggiViewer record={parseGib(HANDICAP_GAME)[0]} />);
    expect(counter()).toHaveTextContent("0 / 6");
  });

  it("reports an integrity error instead of crashing", () => {
    const fromEmptySquare = { ...record.plies[0], from: { rank: 5, file: 5 } };
    const broken = { ...record, plies: [fromEmptySquare, ...record.plies] };
    render(<JanggiViewer record={broken} initialPly={1} />);
    expect(screen.getByRole("alert")).toHaveTextContent("기보 오류");
  });
});

describe("JanggiBoard", () => {
  it("renders 32 pieces and reports clicks with the piece on the square", async () => {
    const user = userEvent.setup();
    const onSquareClick = vi.fn();
    const { container } = render(
      <JanggiBoard board={createStandardSetup().board} onSquareClick={onSquareClick} />,
    );
    expect(container.querySelectorAll("polygon")).toHaveLength(32);
    await user.click(container.querySelector("[data-square='10-1']")!);
    expect(onSquareClick).toHaveBeenCalledWith({ rank: 10, file: 1 }, { side: "cho", type: "chariot" });
    await user.click(container.querySelector("[data-square='5-5']")!);
    expect(onSquareClick).toHaveBeenLastCalledWith({ rank: 5, file: 5 }, null);
  });

  it("draws the last move's origin marker and highlights at the square's coordinates", () => {
    const { container, rerender } = render(
      <JanggiBoard board={record.setup.board} lastPly={record.plies[18]} highlights={[{ rank: 5, file: 5 }]} />,
    );
    // 09 = 10행 9열. 여백 44 + (열-1)*60, 44 + (행-1)*60
    const from = container.querySelector("circle[data-marker='from']")!;
    expect(from.getAttribute("cx")).toBe("524");
    expect(from.getAttribute("cy")).toBe("584");
    const hl = container.querySelector("circle[data-marker='highlight']")!;
    expect(hl.getAttribute("cx")).toBe("284");
    expect(hl.getAttribute("cy")).toBe("284");
    // 뒤집으면 좌우·상하가 반전된다
    rerender(<JanggiBoard board={record.setup.board} lastPly={record.plies[18]} orientation="han" />);
    const flipped = container.querySelector("circle[data-marker='from']")!;
    expect(flipped.getAttribute("cx")).toBe("44");
    expect(flipped.getAttribute("cy")).toBe("44");
  });
});
