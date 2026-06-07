type TemperatureRange = {
  lowC?: number;
  highC?: number;
};

export function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function formatConditionLabel(conditionCode: string, conditionLabel?: string) {
  if (conditionLabel?.trim()) {
    return conditionLabel.trim();
  }

  return conditionCode
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function kmhToMph(kmh?: number) {
  return Math.round((kmh ?? 0) * 0.621371);
}

export function estimateCloudCoverPercent(conditionCode: string, cloudCoverPercent?: number) {
  if (typeof cloudCoverPercent === "number") return Math.round(clampPercentage(cloudCoverPercent));

  const code = conditionCode.toLowerCase();
  if (code.includes("clear")) return 8;
  if (code.includes("partly")) return 45;
  if (code.includes("fog") || code.includes("mist") || code.includes("haze")) return 82;
  if (code.includes("rain") || code.includes("shower") || code.includes("drizzle") || code.includes("snow")) return 88;
  if (code.includes("cloud") || code.includes("overcast")) return 78;
  return 52;
}

// Points are hourly, so the index of the first wet hour is the number of hours
// until precipitation starts.
export function getHoursUntilPrecipitation(points: Array<{ intensity: number; probability: number }>) {
  const index = points.findIndex((point) => point.intensity > 0 || point.probability >= 40);
  return index <= 0 ? null : index;
}

export function formatPrecipitationWindowLabel(leadingLabel: string, minutes: number) {
  return {
    leadingLabel,
    trailingLabel: `${Math.round(minutes)}m`
  };
}

export type PrecipPoint = { time: string; label: string; precipitationMm: number; probability: number; intensity: number };
export type PrecipBand = "none" | "light" | "moderate" | "heavy";

// Standard meteorological rain-rate bands (mm/h).
const LIGHT_MAX = 2.5;
const MODERATE_MAX = 7.6;
const PICKUP_MIN_BAR_HEIGHT = 12;

export function precipitationBand(mm: number): PrecipBand {
  if (mm <= 0.05) return "none";
  if (mm < LIGHT_MAX) return "light";
  if (mm < MODERATE_MAX) return "moderate";
  return "heavy";
}

// Map a rain rate to a 0-100 bar height aligned with the Light / Moderate /
// Heavy gridlines: each band fills one third of the graph so a bar's top lands
// against the matching axis label.
export function precipitationBandHeight(mm: number) {
  if (mm <= 0.05) return 0;
  if (mm < LIGHT_MAX) return 8 + (mm / LIGHT_MAX) * 25; // 8 -> 33
  if (mm < MODERATE_MAX) return 33 + ((mm - LIGHT_MAX) / (MODERATE_MAX - LIGHT_MAX)) * 33; // 33 -> 66
  return Math.min(100, 66 + ((mm - MODERATE_MAX) / 12.4) * 34); // 66 -> 100
}

export function formatClock(time: string) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

// The contiguous rain spell starting at the first visible pickup, with a drizzle
// fallback when no stronger rain arrives. Drives the marker and subtitle.
export function findRainWindow(points: PrecipPoint[]) {
  const pickupIndex = points.findIndex((point) => precipitationBandHeight(point.precipitationMm) >= PICKUP_MIN_BAR_HEIGHT);
  const drizzleIndex = points.findIndex((point) => precipitationBand(point.precipitationMm) !== "none");
  const startIndex = pickupIndex === -1 ? drizzleIndex : pickupIndex;
  if (startIndex === -1) return null;

  let endIndex = startIndex;
  let peak: PrecipBand = "none";
  for (let i = startIndex; i < points.length; i += 1) {
    const band = precipitationBand(points[i].precipitationMm);
    const wet = band !== "none";
    if (!wet) break;
    endIndex = i;
    if (band === "heavy" || (band === "moderate" && peak !== "heavy") || (band === "light" && peak === "none")) {
      peak = band;
    }
  }

  const start = points[startIndex];
  const end = points[endIndex];
  return {
    startIndex,
    endIndex,
    startTime: start.time,
    startClock: formatClock(start.time),
    endClock: formatClock(end.time),
    peakBand: peak === "none" ? "light" : peak,
    continues: endIndex === points.length - 1,
  } as const;
}

export function getTemperatureRangeSegments(allDays: TemperatureRange[], day: TemperatureRange) {
  const lows = allDays.map((item) => item.lowC).filter((value): value is number => value !== undefined);
  const highs = allDays.map((item) => item.highC).filter((value): value is number => value !== undefined);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = Math.max(1, max - min);
  const startPercent = clampPercentage((((day.lowC ?? min) - min) / span) * 100);
  const widthPercent = clampPercentage((((day.highC ?? max) - (day.lowC ?? min)) / span) * 100);

  return {
    startPercent: Number(startPercent.toFixed(1)),
    widthPercent: Number(widthPercent.toFixed(1))
  };
}
