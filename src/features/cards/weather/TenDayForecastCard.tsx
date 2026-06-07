import { cardBehaviorConstants } from "@/constants";
import { cn } from "@/lib/utils";
import type { CardComponentProps } from "../types";
import { WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel, getTemperatureRangeSegments } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function TenDayForecastCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const dayLimit = footprint === "1x1" ? cardBehaviorConstants["weather-ten-day"].defaultVisibleDays ?? 3 : footprint === "2x1" ? 5 : footprint === "2x2" ? 5 : data?.daily.length ?? 0;

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-5">
        <p className="text-sm text-white/72">Loading days...</p>
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
    <WeatherWidgetFrame className={footprint === "1x1" ? "p-3.5" : footprint === "2x2" ? "p-4 md:p-[1.125rem]" : "p-5 md:p-6"} tone="clear">
      <WeatherSectionLabel>10-Day Forecast</WeatherSectionLabel>
      <div className={cn("mt-3", footprint === "1x1" ? "space-y-1.5" : footprint === "2x2" ? "space-y-1.5" : "space-y-2.5 md:mt-4 md:space-y-3")}>
        {data.daily.slice(0, dayLimit).map((day) => {
          const range = getTemperatureRangeSegments(data.daily, day);

          return (
            <div className={cn("grid items-center", footprint === "1x1" ? "grid-cols-[2rem_minmax(0,1fr)_auto] gap-1.5" : footprint === "2x2" ? "grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-2" : "grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-2.5 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:gap-3")} key={day.date}>
              <span className={cn("text-white/72", footprint === "1x1" ? "text-[11px]" : footprint === "2x2" ? "text-[12px]" : "text-sm")}>{day.label}</span>
              <div className={cn("flex min-w-0 items-center", footprint === "1x1" ? "gap-1.5" : footprint === "2x2" ? "gap-2" : "gap-2 md:gap-3")}>
                <span className={cn("min-w-0 flex-1 truncate text-white/68", footprint === "1x1" ? "text-[11px]" : footprint === "2x2" ? "text-[12px]" : "text-[13px] md:text-sm")}>
                  {formatConditionLabel(day.conditionCode)}
                </span>
                <div className={cn("relative h-1.5 shrink-0 rounded-full bg-white/12", footprint === "1x1" ? "w-10" : footprint === "2x2" ? "w-14" : "w-16 md:w-24 lg:w-28")}>
                  <div
                    className="absolute top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-200 via-yellow-200 to-amber-300"
                    style={{ left: `${range.startPercent}%`, width: `${range.widthPercent}%` }}
                  />
                </div>
              </div>
              <span className={cn("whitespace-nowrap text-white", footprint === "1x1" ? "text-[11px]" : footprint === "2x2" ? "text-[12px]" : "text-[13px] md:text-sm")}>
                {Math.round(day.lowC ?? 0)}° {Math.round(day.highC ?? 0)}°
              </span>
            </div>
          );
        })}
      </div>
    </WeatherWidgetFrame>
  );
}
