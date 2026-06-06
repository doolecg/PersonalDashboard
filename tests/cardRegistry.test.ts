import { describe, expect, it } from "vitest";
import { cardRegistry } from "../src/features/cards/registry";

describe("card registry", () => {
  it("keeps cards uniquely registered", () => {
    const ids = cardRegistry.map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(cardRegistry[0]?.Component).toBeTypeOf("function");
  });
});
