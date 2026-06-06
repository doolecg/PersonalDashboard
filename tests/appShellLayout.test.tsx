import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("app shell layout", () => {
  it("renders the main shell edge to edge without outer padding or rounded clipping", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("<main class=\"dark min-h-svh bg-background text-foreground\"");
    expect(markup).not.toContain("max-w-7xl");
    expect(markup).not.toContain("rounded-[2rem]");
    expect(markup).toContain("relative z-10 flex min-h-svh flex-col gap-4");
  });
});
