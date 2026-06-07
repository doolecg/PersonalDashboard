import { describe, expect, it } from "vitest";
import { cardRegistry } from "../src/features/cards/registry";
import { getBoardRowCount, getWidgetBoardMetrics } from "../src/features/cards/gridLayout";

describe("card grid layout", () => {
  it("packs the current registry into fewer rows on denser boards", () => {
    expect(getBoardRowCount(cardRegistry, 4)).toBe(5);
    expect(getBoardRowCount(cardRegistry, 6)).toBe(4);
  });

  it("sizes the widget unit from the available width and height", () => {
    expect(
      getWidgetBoardMetrics({
        availableHeight: 700,
        availableWidth: 1100,
        columnCount: 6,
        gap: 12,
        rowCount: 4,
        scale: 1
      })
    ).toEqual({
      boardHeight: 700,
      boardWidth: 1056,
      unitSize: 166
    });
  });
});
