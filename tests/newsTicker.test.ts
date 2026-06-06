import { describe, expect, it, vi } from "vitest";
import { resolveTickerItems } from "../server/newsTicker";

describe("news ticker", () => {
  it("returns source-labelled article items from configured rss feeds", async () => {
    const fetchFeed = vi
      .fn()
      .mockResolvedValueOnce(new Response(`<?xml version="1.0"?><rss><channel><item><title>First headline</title><link>https://example.com/first</link></item><item><title>Second headline</title><link>https://example.com/second</link></item></channel></rss>`))
      .mockResolvedValueOnce(new Response(`<?xml version="1.0"?><rss><channel><item><title>Third headline</title><link>https://example.com/third</link></item></channel></rss>`));

    await expect(resolveTickerItems({
      footerTickerItems: "Fallback item",
      newsRssFeeds: "BBC|https://example.com/bbc.xml,Globe|https://example.com/globe.xml"
    }, fetchFeed)).resolves.toEqual([
      { source: "BBC", title: "First headline", url: "https://example.com/first" },
      { source: "BBC", title: "Second headline", url: "https://example.com/second" },
      { source: "Globe", title: "Third headline", url: "https://example.com/third" }
    ]);
  });

  it("falls back to footer ticker items when rss feeds produce no titles", async () => {
    const fetchFeed = vi.fn().mockResolvedValue(new Response("<rss><channel></channel></rss>"));

    await expect(resolveTickerItems({
      footerTickerItems: "Alpha|| Beta ",
      newsRssFeeds: "BBC|https://example.com/bbc.xml"
    }, fetchFeed)).resolves.toEqual([
      { source: "Update", title: "Alpha", url: "" },
      { source: "Update", title: "Beta", url: "" }
    ]);
  });
});
