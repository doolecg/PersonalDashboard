import { cardBehaviorConstants } from "@/constants";
import { cn } from "@/lib/utils";
import type { CardComponentProps } from "../types";
import { WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function HourlyForecastCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const visibleHours = cardBehaviorConstants["weather-hourly"].defaultVisibleHours ?? 12;
  const cardWidthClassName = footprint === "4x2" ? "w-[3.35rem]" : footprint === "2x2" ? "w-[3.45rem]" : "w-[3.4rem]";

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-5">
        <p className="text-sm text-white/72">Loading hours...</p>
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
    <WeatherWidgetFrame className={footprint === "4x2" ? "p-4 md:p-5" : "p-4"} tone="cloud">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <WeatherSectionLabel>Hourly Forecast</WeatherSectionLabel>
        <p className="max-w-[45%] truncate text-right text-[11px] font-semibold text-white/70">{data.current.location}</p>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.hourly.slice(0, visibleHours).map((hour, index) => (
          <div className={cn("flex shrink-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] bg-white/6 px-1 py-2 text-center ring-1 ring-white/8 md:px-1.5", cardWidthClassName)} key={hour.time}>
            <span className="text-[10px] text-white/60">{index === 0 ? "Now" : hour.label}</span>
            <span className="text-[0.95rem] font-light text-white md:text-xl">{Math.round(hour.temperatureC ?? 0)}°</span>
            <span className="line-clamp-1 text-[9px] leading-tight text-white/70 md:text-[10px]">
              {formatConditionLabel(hour.conditionCode)}
            </span>
            <span className="text-[10px] text-sky-200/90">{Math.round(hour.probability ?? 0)}%</span>
          </div>
        ))}
      </div>
    </WeatherWidgetFrame>
  );
}
