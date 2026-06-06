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
      tickerItems: ["Alpha", "Beta", "Gamma"]
    });
  });

  it("falls back safely when env values are blank", () => {
    expect(buildShellConfig({
      headerUserName: "   ",
      footerTickerItems: "   "
    })).toEqual({
      userName: "User",
      tickerItems: []
    });
  });

  it("returns the api payload shape from env-backed config", () => {
    expect(getShellConfigResponse({
      headerUserName: "Dayle",
      footerTickerItems: "One||Two"
    })).toEqual({
      userName: "Dayle",
      tickerItems: ["One", "Two"]
    });
  });
});
