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

export function formatPrecipitationWindowLabel(leadingLabel: string, minutes: number) {
  return {
    leadingLabel,
    trailingLabel: `${Math.round(minutes)}m`
  };
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
