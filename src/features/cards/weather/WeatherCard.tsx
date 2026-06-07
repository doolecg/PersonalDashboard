import { MapPin, SunMedium } from "lucide-react";
import { cardBehaviorConstants } from "@/constants";
import { cn } from "@/lib/utils";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import type { CardComponentProps, CardFootprint } from "../types";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

const temperatureClassNameByFootprint: Record<CardFootprint, string> = {
  "1x1": "text-[2.5rem]",
  "1x2": "text-[4.35rem]",
  "2x1": "text-[3.35rem]",
  "2x2": "text-[4.35rem]",
  "4x2": "text-[4.35rem]",
  "4x4": "text-[4.35rem]"
};

const conditionClassNameByFootprint: Record<CardFootprint, string> = {
  "1x1": "text-[11px]",
  "1x2": "text-[13px]",
  "2x1": "text-[12px]",
  "2x2": "text-[13px]",
  "4x2": "text-[13px]",
  "4x4": "text-[13px]"
};

export function WeatherCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const isCompact = footprint === "1x1";
  const isMedium = footprint === "2x1";
  const isExpanded = footprint === "2x2";
  const visibleHours = isExpanded ? 6 : isMedium ? 4 : 0;

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-3">
        <p className="text-xs text-white/72">Loading...</p>
      </WeatherWidgetFrame>
    );
  }

  if (error && !data) {
    return (
      <WeatherWidgetFrame className="p-3">
        <p className="text-xs leading-4 text-rose-100">{error}</p>
      </WeatherWidgetFrame>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <WeatherWidgetFrame className={isExpanded ? "p-4 md:p-5" : isMedium ? "p-4" : "p-3 md:p-3.5"} tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 text-[13px] font-semibold tracking-tight text-white/92">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{data.current.location}</span>
          </p>
          <SunMedium className="h-4 w-4 shrink-0 text-white/72" />
        </div>

        <div className={cn("mt-auto min-h-0", isExpanded ? "space-y-3" : "space-y-1.5")}>
          <p className={cn("font-light leading-none tracking-[-0.08em] text-white", temperatureClassNameByFootprint[footprint])}>
            {Math.round(data.current.temperatureC)}°
          </p>
          <p className={cn("line-clamp-1 font-medium leading-4 text-white/88", conditionClassNameByFootprint[footprint])}>
            {formatConditionLabel(data.current.conditionCode, data.current.conditionLabel)}
          </p>
          <p className="text-[11px] text-white/62">
            H:{Math.round(data.current.highC ?? data.current.temperatureC)}° L:{Math.round(data.current.lowC ?? data.current.temperatureC)}°
          </p>
          {!isCompact ? <p className="line-clamp-2 text-[11px] leading-4 text-white/68">{data.current.summary}</p> : null}
          {visibleHours > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="flex gap-1.5 overflow-hidden">
                {data.hourly.slice(0, cardBehaviorConstants["weather-hourly"].defaultVisibleHours ?? 12).slice(0, visibleHours).map((hour) => (
                  <div className={cn("min-w-0 flex-1 rounded-[1rem] bg-white/6 px-1.5 py-1.5 text-center ring-1 ring-white/8", isExpanded ? "space-y-1" : "space-y-0.5")} key={hour.time}>
                    <p className="text-[10px] text-white/58">{hour.label}</p>
                    <p className={cn("font-light text-white", isExpanded ? "text-[1.2rem]" : "text-sm")}>{Math.round(hour.temperatureC ?? 0)}°</p>
                    {isExpanded ? <p className="truncate text-[10px] text-white/66">{formatConditionLabel(hour.conditionCode)}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
