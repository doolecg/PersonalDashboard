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

    expect(result[0]?.id).toBe("weather-precipitation");
    expect(result.find((card) => card.id === "weather-current")?.footprint).toBe("2x2");
    expect(positioned.find((card) => card.id === "weather-precipitation")).toMatchObject({ column: 0, row: 3 });
  });
});
