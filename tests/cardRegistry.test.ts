import { describe, expect, it } from "vitest";
import { cardBehaviorConstants } from "../src/constants";
import { cardRegistry } from "../src/features/cards/registry";

describe("card registry", () => {
  it("keeps cards uniquely registered", () => {
    const ids = cardRegistry.map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(cardRegistry[0]?.Component).toBeTypeOf("function");
  });

  it("uses only supported widget footprints", () => {
    expect(cardRegistry.map((card) => card.footprint)).toEqual([
      "1x1",
      "2x1",
      "1x1",
      "1x1"
    ]);
  });

  it("keeps default footprints within each card's allowed sizes", () => {
    expect(cardRegistry.every((card) => cardBehaviorConstants[card.id]?.allowedFootprints.includes(card.footprint))).toBe(true);
  });

  it("allows precipitation to scale across compact, medium, large, and showcase footprints", () => {
    expect(cardBehaviorConstants["weather-precipitation"]?.allowedFootprints).toEqual(["1x1", "2x1", "2x2", "4x4"]);
  });
});
