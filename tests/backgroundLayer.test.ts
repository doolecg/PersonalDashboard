import { describe, expect, it } from "vitest";
import { shellBackgroundClassName, shellBackgroundImageClassName, shellForegroundClassName } from "../src/app/shell/background";

describe("shell background layer", () => {
  it("keeps a separate absolute background layer and a relative foreground layer", () => {
    expect(shellBackgroundClassName).toContain("absolute");
    expect(shellBackgroundClassName).toContain("inset-0");
    expect(shellForegroundClassName).toContain("relative");
    expect(shellForegroundClassName).toContain("z-10");
  });

  it("uses a strong blur treatment on the background image", () => {
    expect(shellBackgroundImageClassName).toContain("bg-cover");
    expect(shellBackgroundImageClassName).toContain("bg-center");
    expect(shellBackgroundImageClassName).toContain("blur-");
  });

  it("includes a dark overlay to preserve dashboard contrast", () => {
    expect(shellBackgroundClassName).toContain("before:bg-black/");
    expect(shellBackgroundClassName).toContain("before:absolute");
  });
});
