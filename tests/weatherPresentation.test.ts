import { describe, expect, it } from "vitest";
import { buildWeatherWidgetPayload } from "../server/weather/presentation";
import type { EnsembleWeather } from "../server/weather/types";

function createHourlyPoint(index: number, precipitationMm: number, precipitationProbability: number) {
  const time = new Date(Date.UTC(2026, 5, 6, 10 + index, 0, 0)).toISOString();
  return {
    time,
    temperatureC: 16 + index,
    precipitationMm,
    precipitationProbability,
    weatherCode: precipitationMm > 0 ? 61 : 1,
    windSpeedKmh: 12,
    windDirectionDeg: 200,
    humidityPercent: 72,
    pressureHpa: 1008,
    visibilityKm: 10,
    uvIndex: 4
  };
}

describe("weather presentation", () => {
  it("creates one precipitation graph point per hour on an absolute intensity scale", () => {
    const payload = buildWeatherWidgetPayload({
      location: {
        city: "Birkenhead",
        latitude: 53.37,
        longitude: -3.01,
        timezone: "Europe/London"
      },
      updatedAt: "2026-06-06T10:00:00.000Z",
      sourcesUsed: ["open-meteo-ukmo", "metno", "open-meteo-icon"],
      current: createHourlyPoint(0, 0.4, 70),
      hourly: [
        createHourlyPoint(0, 0.4, 70),
        createHourlyPoint(1, 0.2, 50),
        createHourlyPoint(2, 0, 20),
        createHourlyPoint(3, 0.1, 35)
      ],
      daily: [
        {
          date: "2026-06-06",
          highC: 18,
          lowC: 11,
          precipitationProbability: 70,
          weatherCode: 61,
          sunrise: "2026-06-06T04:52:00.000Z",
          sunset: "2026-06-06T21:31:00.000Z"
        }
      ]
    } satisfies EnsembleWeather);

    // One point per hour (capped at 24); the fixture supplies four hours.
    expect(payload.precipitation.points).toHaveLength(4);
    expect(payload.current.location).toBe("Birkenhead");

    // Light rain (0.4mm/h) maps to a short bar, not a clipped full-height one.
    const intensities = payload.precipitation.points.map((point) => point.intensity);
    expect(Math.max(...intensities)).toBeLessThanOrEqual(100);
    expect(intensities[0]).toBe(8);
    // The second hour (0.2mm) is lighter than the first (0.4mm).
    expect(intensities[1]).toBeLessThan(intensities[0]);
    // The dry third hour reads as no bar.
    expect(intensities[2]).toBe(0);
  });

  it("returns a no-precipitation summary when all values are zero", () => {
    const payload = buildWeatherWidgetPayload({
      location: {
        city: "Birkenhead",
        latitude: 53.37,
        longitude: -3.01,
        timezone: "Europe/London"
      },
      updatedAt: "2026-06-06T10:00:00.000Z",
      sourcesUsed: ["open-meteo-ukmo"],
      current: createHourlyPoint(0, 0, 0),
      hourly: [
        createHourlyPoint(0, 0, 0),
        createHourlyPoint(1, 0, 0),
        createHourlyPoint(2, 0, 0),
        createHourlyPoint(3, 0, 0)
      ],
      daily: [
        {
          date: "2026-06-06",
          highC: 18,
          lowC: 11,
          precipitationProbability: 0,
          weatherCode: 1
        }
      ]
    } satisfies EnsembleWeather);

    expect(payload.precipitation.summary).toMatch(/No precipitation expected/i);
  });
});
