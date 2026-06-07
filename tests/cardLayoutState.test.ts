import { describe, expect, it } from "vitest";
import { cardRegistry } from "../src/features/cards/registry";
import { mergeCardLayout, resolveCardPositions } from "../src/features/cards/gridLayout";

describe("card layout state", () => {
  it("merges saved layout with registry defaults and repacks resized cards", () => {
    const result = mergeCardLayout(cardRegistry, [
      { column: 2, id: "weather-current", footprint: "2x2", order: 3, row: 1 },
      { column: 0, id: "weather-precipitation", footprint: "2x2", order: 0, row: 3 }
    ]);
    const positioned = resolveCardPositions(result, 6);

    expect(result.findIndex((card) => card.id === "weather-precipitation")).toBeLessThan(result.findIndex((card) => card.id === "weather-current"));
    expect(result.find((card) => card.id === "weather-current")?.footprint).toBe("2x2");
    expect(positioned.find((card) => card.id === "weather-precipitation")).toMatchObject({ column: 0, row: 3 });
  });

  it("omits cards saved as hidden", () => {
    const result = mergeCardLayout(cardRegistry, [
      { column: 0, id: "weather-ai-report", footprint: "2x1", order: 1, row: 0, visible: false }
    ]);

    expect(result.some((card) => card.id === "weather-ai-report")).toBe(false);
  });
});
