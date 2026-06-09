import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("app shell layout", () => {
  it("locks the shell to the viewport and keeps the grid in a bounded content region", () => {
    const markup = renderToStaticMarkup(<App />);

    // Outer shell is viewport-locked
    expect(markup).toContain("<main class=\"dark h-svh overflow-hidden bg-background text-foreground\"");
    // No accidental max-width constraint on the layout
    expect(markup).not.toContain("max-w-7xl");
    // PlannerShell structure is present
    expect(markup).toContain("class=\"planner\"");
    expect(markup).toContain("class=\"layout\"");
    // News dashboard column grid is rendered
    expect(markup).toContain("class=\"body\"");
    expect(markup).toContain("class=\"col\"");
  });
});
