import { describe, expect, it } from "vitest";
import { buildTickerTrack, getConnectionState } from "../src/app/shell/shellUi";

describe("shell ui helpers", () => {
  it("duplicates ticker items for a seamless marquee track", () => {
    expect(buildTickerTrack([
      { source: "BBC", title: "Alpha", url: "https://example.com/a" },
      { source: "Globe", title: "Beta", url: "https://example.com/b" }
    ])).toEqual([
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
