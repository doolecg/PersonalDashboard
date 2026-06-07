import type { WeatherWidgetPayload } from "./types";

export type WeatherDevScenario = "live" | "clear" | "rain" | "snow" | "thunder" | "alerts";

function buildPrecipitationPoints({
  delayMinutes,
  peakIntensity,
  peakProbability,
  precipitationStep
}: {
  delayMinutes: number;
  peakIntensity: number;
  peakProbability: number;
  precipitationStep: number;
}) {
  return Array.from({ length: 60 }, (_, index) => {
    const activeMinute = Math.max(0, index - delayMinutes);
    const ramp = Math.min(activeMinute / 24, 1);
    const taper = index > 42 ? Math.max(0.72, 1 - (index - 42) / 75) : 1;
    const intensity = Math.round(peakIntensity * ramp * taper);
    const probability = activeMinute === 0 ? 0 : Math.round(Math.min(peakProbability, 28 + peakProbability * ramp * taper));

    return {
      time: `2026-06-07T10:${String(index).padStart(2, "0")}:00Z`,
      label: `${index}m`,
      precipitationMm: Number((activeMinute * precipitationStep * taper).toFixed(2)),
      probability,
      intensity
    };
  });
}

function buildBasePayload(overrides: Partial<WeatherWidgetPayload>): WeatherWidgetPayload {
  const base: WeatherWidgetPayload = {
    current: {
      location: "Harbor City",
      temperatureC: 16,
      feelsLikeC: 15,
      conditionLabel: "Clear",
      conditionCode: "clear",
      highC: 19,
      lowC: 12,
      summary: "Calm conditions through the afternoon."
    },
    precipitation: {
      summary: "No precipitation expected.",
      points: Array.from({ length: 60 }, (_, index) => ({
        time: `2026-06-07T10:${String(index).padStart(2, "0")}:00Z`,
        label: `${index}m`,
        precipitationMm: 0,
        probability: 0,
        intensity: 0
      }))
    },
    hourly: Array.from({ length: 8 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: 16 + index,
      probability: 0,
      conditionCode: "clear"
    })),
    daily: Array.from({ length: 5 }, (_, index) => ({
      date: `2026-06-${String(index + 7).padStart(2, "0")}`,
      label: `D${index + 1}`,
      highC: 19 + index,
      lowC: 11 + index,
      probability: 0,
      conditionCode: "clear"
    })),
    details: {
      humidityPercent: 58,
      windKmh: 11,
      windDirectionLabel: "SW",
      pressureHpa: 1018,
      visibilityKm: 16,
      uvIndex: 6,
      sunrise: "2026-06-07T04:45:00Z",
      sunset: "2026-06-07T21:15:00Z"
    },
    meta: {
      updatedAt: "2026-06-07T09:00:00Z",
      sourcesUsed: ["dev-scenario"]
    }
  };

  return {
    ...base,
    ...overrides,
    current: { ...base.current, ...overrides.current },
    precipitation: { ...base.precipitation, ...overrides.precipitation },
    hourly: overrides.hourly ?? base.hourly,
    daily: overrides.daily ?? base.daily,
    details: { ...base.details, ...overrides.details },
    meta: { ...base.meta, ...overrides.meta }
  };
}

export const weatherDevScenarios: Record<Exclude<WeatherDevScenario, "live">, WeatherWidgetPayload> = {
  clear: buildBasePayload({}),
  rain: buildBasePayload({
    current: {
      location: "Rain Harbor",
      temperatureC: 12,
      feelsLikeC: 10,
      conditionLabel: "Rain",
      conditionCode: "rain",
      summary: "Steady rain for the next hour with slick roads."
    },
    precipitation: {
      summary: "Rain starting in 6 min.",
      points: buildPrecipitationPoints({ delayMinutes: 6, peakIntensity: 70, peakProbability: 92, precipitationStep: 0.035 })
    },
    hourly: Array.from({ length: 8 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: 12 + index * 0.3,
      probability: 70 + index * 3,
      conditionCode: "rain"
    }))
  }),
  snow: buildBasePayload({
    current: {
      location: "Snowfield",
      temperatureC: -1,
      feelsLikeC: -5,
      conditionLabel: "Snow",
      conditionCode: "snow",
      summary: "Wet snow continues with reduced visibility."
    },
    precipitation: {
      summary: "Snow bands will pulse through the next hour.",
      points: buildPrecipitationPoints({ delayMinutes: 3, peakIntensity: 58, peakProbability: 86, precipitationStep: 0.018 })
    },
    hourly: Array.from({ length: 8 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: -1 + index * 0.2,
      probability: 60 + index * 4,
      conditionCode: "snow"
    }))
  }),
  thunder: buildBasePayload({
    current: {
      location: "Thunder Point",
      temperatureC: 18,
      feelsLikeC: 19,
      conditionLabel: "Thunderstorm",
      conditionCode: "thunderstorm",
      summary: "Storm cells nearby with lightning risk and sudden downpours."
    },
    precipitation: {
      summary: "Heavy showers spike as the storm line passes.",
      points: buildPrecipitationPoints({ delayMinutes: 1, peakIntensity: 92, peakProbability: 98, precipitationStep: 0.055 })
    },
    hourly: Array.from({ length: 8 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: 18 - index * 0.2,
      probability: 85 + index * 2,
      conditionCode: "thunderstorm"
    }))
  }),
  alerts: buildBasePayload({
    current: {
      location: "Alert Coast",
      temperatureC: 14,
      feelsLikeC: 13,
      conditionLabel: "Wind Advisory",
      conditionCode: "wind",
      summary: "Weather alert active for severe coastal gusts this evening."
    },
    precipitation: {
      summary: "Mostly dry, but squalls may form near the front.",
      points: Array.from({ length: 6 }, (_, index) => ({
        time: `2026-06-07T10:0${index}:00Z`,
        label: `${index * 10}m`,
        precipitationMm: index === 4 ? 0.5 : 0,
        probability: index === 4 ? 45 : 10,
        intensity: index === 4 ? 30 : 0
      }))
    },
    hourly: Array.from({ length: 8 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: 14 - index * 0.1,
      probability: index === 4 ? 45 : 10,
      conditionCode: "wind"
    })),
    details: {
      windKmh: 48,
      windDirectionLabel: "WNW",
      visibilityKm: 11
    }
  })
};

type ResolveWeatherPayloadOptions = {
  isDev: boolean;
  livePayload: WeatherWidgetPayload | null;
  scenario: WeatherDevScenario;
};

export function resolveWeatherPayload({ isDev, livePayload, scenario }: ResolveWeatherPayloadOptions) {
  if (!isDev || scenario === "live") {
    return livePayload;
  }

  return weatherDevScenarios[scenario];
}
