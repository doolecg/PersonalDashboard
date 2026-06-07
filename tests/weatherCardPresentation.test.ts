import { describe, expect, it } from "vitest";
import {
  clampPercentage,
  findRainWindow,
  formatConditionLabel,
  formatPrecipitationWindowLabel,
  getTemperatureRangeSegments
} from "../src/features/cards/weather/weatherPresentation";

describe("weather card presentation helpers", () => {
  it("formats underscored condition codes into title-cased labels", () => {
    expect(formatConditionLabel("partly_cloudy_day", "")).toBe("Partly Cloudy Day");
  });

  it("prefers provided condition labels when present", () => {
    expect(formatConditionLabel("rain_showers", "Rain starting soon")).toBe("Rain starting soon");
  });

  it("formats the next-hour precipitation window labels", () => {
    expect(formatPrecipitationWindowLabel("Now", 60)).toEqual({
      leadingLabel: "Now",
      trailingLabel: "60m"
    });
  });

  it("clamps percentage values into the expected UI range", () => {
    expect(clampPercentage(-10)).toBe(0);
    expect(clampPercentage(42)).toBe(42);
    expect(clampPercentage(160)).toBe(100);
  });

  it("returns normalized temperature segments for forecast bars", () => {
    expect(
      getTemperatureRangeSegments(
        [
          { lowC: 10, highC: 18 },
          { lowC: 7, highC: 21 },
          { lowC: 12, highC: 16 }
        ],
        { lowC: 10, highC: 18 }
      )
    ).toEqual({
      startPercent: 21.4,
      widthPercent: 57.1
    });
  });

  it("anchors the rain window to the first meaningful rain pickup", () => {
    const points = [
      { time: "2026-06-07T16:00:00Z", label: "Now", precipitationMm: 0, probability: 65, intensity: 0 },
      { time: "2026-06-07T17:00:00Z", label: "17", precipitationMm: 0.08, probability: 55, intensity: 1 },
      { time: "2026-06-07T18:00:00Z", label: "18", precipitationMm: 0, probability: 45, intensity: 0 },
      { time: "2026-06-07T19:00:00Z", label: "19", precipitationMm: 0.55, probability: 80, intensity: 8 },
      { time: "2026-06-07T20:00:00Z", label: "20", precipitationMm: 0.7, probability: 82, intensity: 10 }
    ];

    expect(findRainWindow(points)?.startIndex).toBe(3);
  });
});
