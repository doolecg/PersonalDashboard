import { describe, expect, it } from "vitest";
import { cardRegistry } from "../src/features/cards/registry";
import { getBoardRowCount, getFootprintDimensions, getWidgetBoardMetrics } from "../src/features/cards/gridLayout";

describe("card grid layout", () => {
  it("packs the current registry into fewer rows on denser boards", () => {
    expect(getBoardRowCount(cardRegistry, 4)).toBe(12);
    expect(getBoardRowCount(cardRegistry, 6)).toBe(8);
  });

  it("uses the configured widget unit instead of shrinking from card count", () => {
    expect(
      getWidgetBoardMetrics({
        availableHeight: 900,
        availableWidth: 1400,
        columnCount: 6,
        gap: 12,
        rowCount: 4,
        lockedUnit: 142
      })
    ).toEqual({
      boardHeight: 604,
      boardWidth: 912,
      unitSize: 142
    });
  });

  it("supports a 4x4 showcase footprint", () => {
    expect(getFootprintDimensions("4x4")).toEqual({ columns: 4, rows: 4 });
  });
});
