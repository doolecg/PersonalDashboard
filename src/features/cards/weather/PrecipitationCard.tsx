import { CloudRain } from "lucide-react";
import { WeatherDivider, WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { clampPercentage, formatPrecipitationWindowLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function PrecipitationCard() {
  const { data, error, loading } = useWeatherData();
  const points = data?.precipitation.points ?? [];
  const labels = formatPrecipitationWindowLabel("Now", 60);

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-5">
        <p className="text-sm text-white/72">Loading forecast...</p>
      </WeatherWidgetFrame>
    );
  }

  if (error && !data) {
    return (
      <WeatherWidgetFrame className="p-5">
        <p className="text-sm text-rose-100">{error}</p>
      </WeatherWidgetFrame>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <WeatherWidgetFrame className="p-5 md:p-6" tone="storm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <WeatherSectionLabel>Next-Hour Precipitation</WeatherSectionLabel>
          <p className="mt-2 text-base font-medium text-white md:text-lg">{data.precipitation.summary}</p>
        </div>
        <CloudRain className="h-5 w-5 shrink-0 text-white/80" />
      </div>

      <div className="mt-4 flex-1 space-y-3">
        <div className="grid h-24 items-end gap-1 md:h-28" style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}>
          {points.map((point) => (
            <div key={point.time} className="flex h-full items-end">
              <div
                className="w-full rounded-full bg-sky-300/90"
                style={{
                  height: `${Math.max(10, clampPercentage(point.intensity) * 0.72)}px`,
                  opacity: Math.max(0.35, point.probability / 100)
                }}
              />
            </div>
          ))}
        </div>
        <WeatherDivider />
        <div className="flex justify-between text-sm text-white/56">
          <span>{labels.leadingLabel}</span>
          <span>{labels.trailingLabel}</span>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
