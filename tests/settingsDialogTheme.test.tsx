import { describe, expect, it, vi } from "vitest";
import * as SettingsDialogModule from "../src/features/settings/SettingsDialog";

vi.mock("../src/app/preferences/usePreferences", () => ({
  usePreferences: () => ({
    backgroundImage: "",
    clock24h: true,
    displayName: "",
    location: null,
    profileImage: "",
    showBackground: true,
    showTicker: true
  })
}));

describe("settings dialog theme", () => {
  it("keeps the portaled settings surface in dark mode", () => {
    const className = (SettingsDialogModule as Record<string, unknown>).settingsDialogContentClassName;

    expect(className).toBeTypeOf("string");
    expect(className).toContain("dark");
    expect(className).toContain("bg-background");
  });
});
