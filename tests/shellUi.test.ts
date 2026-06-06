import { describe, expect, it } from "vitest";
import { buildTickerTrack, getConnectionState } from "../src/app/shell/shellUi";

describe("shell ui helpers", () => {
  it("duplicates ticker items for a seamless marquee track", () => {
    expect(buildTickerTrack(["Alpha", "Beta"])).toEqual(["Alpha", "Beta", "Alpha", "Beta"]);
  });

  it("provides a fallback ticker message when there are no items", () => {
    expect(buildTickerTrack([])).toEqual(["No news updates configured", "No news updates configured"]);
  });

  it("maps successful health checks to an online pill", () => {
    expect(getConnectionState(true)).toEqual({ label: "Online", tone: "online" });
  });

  it("maps failed health checks to an offline pill", () => {
    expect(getConnectionState(false)).toEqual({ label: "Offline", tone: "offline" });
  });
});
