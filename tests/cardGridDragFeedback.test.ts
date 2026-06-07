import { describe, expect, it } from "vitest";
import { getCardDragStateClassNames, isActiveGridSlot } from "../src/features/cards/cardDragFeedback";

describe("card grid drag feedback", () => {
  it("identifies the active hover slot by row and column", () => {
    expect(isActiveGridSlot({ column: 2, row: 1 }, 2, 1)).toBe(true);
    expect(isActiveGridSlot({ column: 2, row: 1 }, 1, 1)).toBe(false);
    expect(isActiveGridSlot(null, 2, 1)).toBe(false);
  });

  it("returns stronger classes for the active slot and dragged card", () => {
    const { cardClassName, slotClassName } = getCardDragStateClassNames({
      isActiveSlot: true,
      isDragged: true
    });

    expect(slotClassName).toContain("border-sky-200/55");
    expect(cardClassName).toContain("opacity-70");
    expect(cardClassName).toContain("scale-[0.985]");
  });
});
