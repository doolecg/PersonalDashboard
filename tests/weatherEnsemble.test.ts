import { describe, expect, it } from "vitest";
import { mergeWeatherSources } from "../server/weather/ensemble";
import type { NormalizedWeatherSource } from "../server/weather/types";

function createSource(source: NormalizedWeatherSource["source"], precipitationMm: number): NormalizedWeatherSource {
  return {
    source,
    fetchedAt: "2026-06-06T10:00:00.000Z",
    location: {
      city: "Birkenhead",
      latitude: 53.37,
      longitude: -3.01,
      timezone: "Europe/London"
    },
    current: {
      time: "2026-06-06T10:00:00.000Z",
      temperatureC: 17,
      precipitationMm,
      precipitationProbability: 40,
      weatherCode: source
    },
    hourly: [
      {
        time: "2026-06-06T10:00:00.000Z",
        temperatureC: 17,
        precipitationMm,
        precipitationProbability: 40,
        weatherCode: source
      }
    ],
    daily: [
      {
        date: "2026-06-06",
        highC: 18,
        lowC: 11,
        precipitationMm,
        precipitationProbability: 40,
        weatherCode: source
      }
    ]
  };
}

describe("weather ensemble", () => {
  it("biases short-term precipitation toward ukmo", () => {
    const merged = mergeWeatherSources([
      createSource("open-meteo-ukmo", 1),
      createSource("metno", 0),
      createSource("open-meteo-icon", 0)
    ]);

    expect(merged.hourly[0]?.precipitationMm).toBeCloseTo(0.5, 5);
  });

  it("renormalizes when one source is unavailable", () => {
    const merged = mergeWeatherSources([
      createSource("open-meteo-ukmo", 1),
      createSource("metno", 0)
    ]);

    expect(merged.sourcesUsed).toEqual(["open-meteo-ukmo", "metno"]);
    expect(merged.hourly[0]?.precipitationMm).toBeCloseTo(0.625, 5);
  });
});
