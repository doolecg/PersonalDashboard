import { describe, expect, it } from "vitest";
import { normalizeMetNo, normalizeOpenMeteo } from "../server/weather/normalize";

describe("weather normalization", () => {
  it("normalizes open-meteo hourly precipitation fields", () => {
    const result = normalizeOpenMeteo(
      {
        latitude: 53.37,
        longitude: -3.01,
        timezone: "Europe/London",
        current: {
          time: "2026-06-06T10:00",
          temperature_2m: 17,
          apparent_temperature: 16,
          precipitation: 0.2,
          weather_code: 61,
          wind_speed_10m: 10,
          wind_direction_10m: 180,
          wind_gusts_10m: 18,
          relative_humidity_2m: 72,
          pressure_msl: 1008,
          cloud_cover: 64,
          visibility: 9600,
          uv_index: 4
        },
        hourly: {
          time: ["2026-06-06T10:00", "2026-06-06T11:00"],
          temperature_2m: [17, 18],
          apparent_temperature: [16, 17],
          precipitation: [0.4, 0.1],
          precipitation_probability: [70, 30],
          weather_code: [61, 3],
          wind_speed_10m: [10, 12],
          wind_direction_10m: [180, 190],
          wind_gusts_10m: [18, 20],
          relative_humidity_2m: [72, 68],
          pressure_msl: [1008, 1009],
          cloud_cover: [64, 44],
          visibility: [9600, 11000],
          uv_index: [4, 5]
        },
        daily: {
          time: ["2026-06-06"],
          weather_code: [61],
          temperature_2m_max: [18],
          temperature_2m_min: [12],
          precipitation_sum: [3.2],
          precipitation_probability_max: [80],
          wind_speed_10m_max: [25],
          sunrise: ["2026-06-06T04:52"],
          sunset: ["2026-06-06T21:31"]
        }
      },
      "open-meteo-ukmo",
      "Birkenhead"
    );

    expect(result.hourly[0]?.precipitationMm).toBe(0.4);
    expect(result.hourly[0]?.precipitationProbability).toBe(70);
    expect(result.hourly[0]?.visibilityKm).toBe(9.6);
    expect(result.daily[0]?.highC).toBe(18);
    expect(result.daily[0]?.lowC).toBe(12);
  });

  it("aggregates met.no daily highs and lows from hourly points", () => {
    const result = normalizeMetNo(
      {
        properties: {
          timeseries: [
            {
              time: "2026-06-06T00:00:00Z",
              data: {
                instant: {
                  details: {
                    air_temperature: 11,
                    relative_humidity: 80,
                    wind_speed: 4,
                    wind_from_direction: 180,
                    air_pressure_at_sea_level: 1007,
                    cloud_area_fraction: 50,
                    ultraviolet_index_clear_sky: 2,
                    fog_area_fraction: 0
                  }
                },
                next_1_hours: {
                  summary: { symbol_code: "rain" },
                  details: { precipitation_amount: 0.5, probability_of_precipitation: 40 }
                }
              }
            },
            {
              time: "2026-06-06T12:00:00Z",
              data: {
                instant: {
                  details: {
                    air_temperature: 18,
                    relative_humidity: 61,
                    wind_speed: 6,
                    wind_from_direction: 210,
                    air_pressure_at_sea_level: 1012,
                    cloud_area_fraction: 25,
                    ultraviolet_index_clear_sky: 5,
                    fog_area_fraction: 0
                  }
                },
                next_1_hours: {
                  summary: { symbol_code: "partlycloudy_day" },
                  details: { precipitation_amount: 0, probability_of_precipitation: 10 }
                }
              }
            }
          ]
        }
      },
      "Birkenhead",
      53.37,
      -3.01
    );

    expect(result.daily[0]?.highC).toBe(18);
    expect(result.daily[0]?.lowC).toBe(11);
    expect(result.daily[0]?.precipitationMm).toBe(0.5);
    expect(result.hourly[0]?.precipitationProbability).toBe(40);
  });
});
