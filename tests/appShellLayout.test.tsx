import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("app shell layout", () => {
  it("locks the shell to the viewport and keeps the grid in a bounded content region", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("<main class=\"dark h-svh overflow-hidden bg-background text-foreground\"");
    expect(markup).not.toContain("max-w-7xl");
    expect(markup).toContain("relative z-10 flex h-full flex-col gap-3 px-4 py-3");
    expect(markup).toContain("flex h-full w-full min-h-0 items-center justify-center overflow-hidden");
    expect(markup).toContain("grid-cols-[repeat(4,var(--widget-unit))]");
    expect(markup).toContain("md:grid-cols-[repeat(6,var(--widget-unit-desktop))]");
  });
});
