import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ShellFooter } from "../src/app/shell/ShellFooter";

describe("shell footer", () => {
  it("renders the ticker with much wider spacing and a slower marquee speed", () => {
    const markup = renderToStaticMarkup(
      <ShellFooter
        tickerItems={[{ source: "BBC", title: "Headline", url: "https://example.com/story" }]}
        connection={{ label: "Online", tone: "online" }}
      />
    );

    expect(markup).toContain("shell-ticker-track flex min-w-max items-center gap-24 pr-24");
    expect(markup).toContain("--shell-ticker-duration:2000s");
    expect(markup).toContain("BBC");
    expect(markup).toContain("Headline");
    expect(markup).toContain("·");
    expect(markup).toContain('href="https://example.com/story"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer"');
  });
});
