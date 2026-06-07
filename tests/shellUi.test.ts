import { describe, expect, it } from "vitest";
import { buildTickerTrack, getConnectionState, getMillisecondsUntilNextTickerBucket, getTickerSeedBucket } from "../src/app/shell/shellUi";

describe("shell ui helpers", () => {
  it("groups time into 15-minute ticker seed buckets", () => {
    expect(getTickerSeedBucket(0)).toBe(0);
    expect(getTickerSeedBucket(899999)).toBe(0);
    expect(getTickerSeedBucket(900000)).toBe(1);
  });

  it("reports milliseconds until the next 15-minute ticker bucket", () => {
    expect(getMillisecondsUntilNextTickerBucket(0)).toBe(900000);
    expect(getMillisecondsUntilNextTickerBucket(899000)).toBe(1000);
    expect(getMillisecondsUntilNextTickerBucket(900000)).toBe(900000);
  });

  it("cycles through randomized sources one after another", () => {
    expect(buildTickerTrack([
      { source: "BBC", title: "A1", url: "https://example.com/a1" },
      { source: "BBC", title: "A2", url: "https://example.com/a2" },
      { source: "Globe", title: "B1", url: "https://example.com/b1" },
      { source: "Echo", title: "C1", url: "https://example.com/c1" }
    ], () => 0)).toEqual([
      { source: "Globe", title: "B1", url: "https://example.com/b1" },
      { source: "Echo", title: "C1", url: "https://example.com/c1" },
      { source: "BBC", title: "A1", url: "https://example.com/a1" },
      { source: "BBC", title: "A2", url: "https://example.com/a2" },
      { source: "Globe", title: "B1", url: "https://example.com/b1" },
      { source: "Echo", title: "C1", url: "https://example.com/c1" },
      { source: "BBC", title: "A1", url: "https://example.com/a1" },
      { source: "BBC", title: "A2", url: "https://example.com/a2" }
    ]);
  });

  it("duplicates ticker items for a seamless marquee track", () => {
    expect(buildTickerTrack([
      { source: "BBC", title: "Alpha", url: "https://example.com/a" },
      { source: "Globe", title: "Beta", url: "https://example.com/b" }
    ], () => 0.99)).toEqual([
      { source: "BBC", title: "Alpha", url: "https://example.com/a" },
      { source: "Globe", title: "Beta", url: "https://example.com/b" },
      { source: "BBC", title: "Alpha", url: "https://example.com/a" },
      { source: "Globe", title: "Beta", url: "https://example.com/b" }
    ]);
  });

  it("provides a fallback ticker message when there are no items", () => {
    expect(buildTickerTrack([])).toEqual([
      { source: "Update", title: "No news updates configured", url: "" },
      { source: "Update", title: "No news updates configured", url: "" }
    ]);
  });

  it("maps successful health checks to an online pill", () => {
    expect(getConnectionState(true)).toEqual({ label: "Online", tone: "online" });
  });

  it("maps failed health checks to an offline pill", () => {
    expect(getConnectionState(false)).toEqual({ label: "Offline", tone: "offline" });
  });
});
