import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HourlyForecastCard } from "../src/features/cards/weather/HourlyForecastCard";
import { PrecipitationCard } from "../src/features/cards/weather/PrecipitationCard";
import { TenDayForecastCard } from "../src/features/cards/weather/TenDayForecastCard";
import { WeatherCard } from "../src/features/cards/weather/WeatherCard";
import type { WeatherWidgetPayload } from "../src/features/cards/weather/types";

const useWeatherDataMock = vi.fn();

vi.mock("../src/features/cards/weather/useWeatherData", () => ({
  useWeatherData: () => useWeatherDataMock()
}));

function buildWeatherPayload(): WeatherWidgetPayload {
  return {
    current: {
      location: "Birkenhead",
      temperatureC: 15,
      feelsLikeC: 14,
      conditionLabel: "Cloudy",
      conditionCode: "cloudy",
      highC: 18,
      lowC: 13,
      summary: "No precipitation expected in the next four hours."
    },
    precipitation: {
      summary: "Light rain beginning in 20 minutes.",
      points: Array.from({ length: 60 }, (_, index) => ({
        time: `2026-06-07T10:${String(index).padStart(2, "0")}:00Z`,
        label: `${index}m`,
        precipitationMm: index < 8 ? 0 : index / 60,
        probability: index < 8 ? 0 : Math.min(90, 30 + index),
        intensity: index < 8 ? 0 : Math.min(72, index + 12)
      }))
    },
    hourly: Array.from({ length: 16 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: 15 + index,
      probability: index,
      conditionCode: "cloudy"
    })),
    daily: Array.from({ length: 6 }, (_, index) => ({
      date: `2026-06-${String(index + 1).padStart(2, "0")}`,
      label: `D${index + 1}`,
      highC: 20 + index,
      lowC: 10 + index,
      probability: index * 10,
      conditionCode: "cloudy"
    })),
    details: {
      humidityPercent: 71,
      windKmh: 10,
      uvIndex: 5,
      sunrise: "2026-06-07T04:45:00Z",
      sunset: "2026-06-07T21:15:00Z"
    },
    meta: {
      updatedAt: "2026-06-07T09:00:00Z",
      sourcesUsed: ["mock"]
    }
  };
}

describe("weather widget density", () => {
  beforeEach(() => {
    useWeatherDataMock.mockReturnValue({
      data: buildWeatherPayload(),
      error: null,
      loading: false,
      refresh: vi.fn()
    });
  });

  it("limits the compact hourly card to 12 visible hours", () => {
    const markup = renderToStaticMarkup(<HourlyForecastCard footprint="2x1" />);

    expect(markup).toContain("H00");
    expect(markup).toContain("H11");
    expect(markup).not.toContain("H12");
  });

  it("limits the compact ten-day card to three visible days", () => {
    const markup = renderToStaticMarkup(<TenDayForecastCard footprint="1x1" />);

    expect(markup).toContain("D1");
    expect(markup).toContain("D3");
    expect(markup).not.toContain("D4");
  });

  it("shows hourly detail inside the larger current weather card", () => {
    const markup = renderToStaticMarkup(<WeatherCard footprint="2x2" />);

    expect(markup).toContain("H00");
    expect(markup).toContain("H05");
  });

  it("applies footprint-specific headline sizing in the current weather card", () => {
    const compact = renderToStaticMarkup(<WeatherCard footprint="1x1" />);
    const medium = renderToStaticMarkup(<WeatherCard footprint="2x1" />);
    const expanded = renderToStaticMarkup(<WeatherCard footprint="2x2" />);

    expect(compact).toContain("text-[2.5rem]");
    expect(medium).toContain("text-[3.35rem]");
    expect(expanded).toContain("text-[4.35rem]");
  });

  it("applies footprint-specific spacing and opacity polish in the precipitation graph", () => {
    const compact = renderToStaticMarkup(<PrecipitationCard footprint="2x1" />);
    const expanded = renderToStaticMarkup(<PrecipitationCard footprint="2x2" />);

    expect(compact).toContain("gap-px");
    expect(expanded).toContain("gap-[4px]");
    expect(compact).toContain("opacity:0.22");
    expect(expanded).toContain("opacity:0.22");
  });

  it("renders the next-hour rain graph as the lower band in the compact precipitation card", () => {
    const markup = renderToStaticMarkup(<PrecipitationCard footprint="2x1" />);

    expect(markup).toContain("data-compact-precipitation-widget=\"true\"");
    expect(markup).toContain("h-[4.75rem]");
    expect(markup).toContain("grid-cols-[6.25rem_1fr_auto]");
    expect(markup).toContain("data-precipitation-rails=\"true\"");
    expect(markup).toContain("data-precipitation-graph=\"next-hour\"");
    expect(markup).toContain("gap-px");
    expect(markup).toContain("h-[2.35rem]");
    expect(markup).toContain("data-precipitation-labels=\"true\"");
    expect((markup.match(/data-precipitation-bar/g) ?? []).length).toBe(60);
  });

  it("fits precipitation information across every supported footprint", () => {
    const oneByOne = renderToStaticMarkup(<PrecipitationCard footprint="1x1" />);
    const twoByOne = renderToStaticMarkup(<PrecipitationCard footprint="2x1" />);
    const twoByTwo = renderToStaticMarkup(<PrecipitationCard footprint="2x2" />);
    const fourByFour = renderToStaticMarkup(<PrecipitationCard footprint="4x4" />);

    expect(oneByOne).toContain("data-precipitation-footprint=\"1x1\"");
    expect(oneByOne).toContain("data-precipitation-graph=\"next-hour\"");
    expect(twoByOne).toContain("data-precipitation-footprint=\"2x1\"");
    expect(twoByOne).toContain("grid-cols-[6.25rem_1fr_auto]");
    expect(twoByTwo).toContain("data-precipitation-footprint=\"2x2\"");
    expect(twoByTwo).toContain("data-precipitation-details=\"expanded\"");
    expect(fourByFour).toContain("data-precipitation-footprint=\"4x4\"");
    expect(fourByFour).toContain("data-precipitation-details=\"showcase\"");
  });
});
