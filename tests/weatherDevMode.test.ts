import { describe, expect, it } from "vitest";
import { resolveWeatherPayload, weatherDevScenarios } from "../src/features/cards/weather/devWeatherScenarios";
import type { WeatherWidgetPayload } from "../src/features/cards/weather/types";

function buildLivePayload(): WeatherWidgetPayload {
  return {
    current: {
      location: "Live Bay",
      temperatureC: 11,
      feelsLikeC: 9,
      conditionLabel: "Clear",
      conditionCode: "clear",
      highC: 13,
      lowC: 7,
      summary: "Live weather response."
    },
    precipitation: {
      summary: "Dry for the next hour.",
      points: []
    },
    hourly: [],
    daily: [],
    details: {},
    meta: {
      updatedAt: "2026-06-07T09:00:00Z",
      sourcesUsed: ["live"]
    }
  };
}

describe("weather dev mode", () => {
  it("returns live payload outside development mode", () => {
    const livePayload = buildLivePayload();

    expect(resolveWeatherPayload({ isDev: false, livePayload, scenario: "thunder" })).toBe(livePayload);
  });

  it("returns live payload when the scenario is live", () => {
    const livePayload = buildLivePayload();

    expect(resolveWeatherPayload({ isDev: true, livePayload, scenario: "live" })).toBe(livePayload);
  });

  it("returns the selected development scenario payload in development", () => {
    expect(resolveWeatherPayload({ isDev: true, livePayload: buildLivePayload(), scenario: "thunder" })).toBe(weatherDevScenarios.thunder);
    expect(weatherDevScenarios.alerts.current.location).toBe("Alert Coast");
  });

  it("provides full next-hour precipitation points for rainy development scenarios", () => {
    expect(weatherDevScenarios.rain.precipitation.points).toHaveLength(60);
    expect(weatherDevScenarios.thunder.precipitation.points).toHaveLength(60);
    expect(weatherDevScenarios.snow.precipitation.points).toHaveLength(60);
  });
});
