import { describe, expect, it } from "vitest";
import { getShellConfigResponse } from "../server/routes/shell";
import { buildShellConfig } from "../server/shellConfig";

describe("shell config", () => {
  it("parses the user name and ticker items from env values", () => {
    expect(buildShellConfig({
      headerUserName: "Dayle",
      footerTickerItems: "Alpha|| Beta || ||Gamma"
    })).toEqual({
      userName: "Dayle",
      tickerItems: [
        { source: "Update", title: "Alpha", url: "" },
        { source: "Update", title: "Beta", url: "" },
        { source: "Update", title: "Gamma", url: "" }
      ]
    });
  });

  it("falls back safely when env values are blank", () => {
    expect(buildShellConfig({
      headerUserName: "   ",
      footerTickerItems: "   "
    })).toEqual({
      userName: "Aura",
      tickerItems: []
    });
  });

  it("returns the api payload shape from env-backed config", () => {
    expect(getShellConfigResponse({
      headerUserName: "Dayle",
      footerTickerItems: "One||Two"
    })).toEqual({
      userName: "Dayle",
      tickerItems: [
        { source: "Update", title: "One", url: "" },
        { source: "Update", title: "Two", url: "" }
      ]
    });
  });
});
