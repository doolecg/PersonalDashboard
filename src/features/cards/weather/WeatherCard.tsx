import { Sunset } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { WeatherGlyph, WeatherHeader } from "./weatherGlyph";
import type { CardComponentProps, CardFootprint } from "../types";
import { formatClock, formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

const temperatureClassNameByFootprint: Record<CardFootprint, string> = {
  "1x1": "text-[3rem]",
  "1x2": "text-[3.6rem]",
  "2x1": "text-[3.4rem]",
  "2x2": "text-[3.75rem]",
  "4x2": "text-[3.75rem]",
  "4x4": "text-[4.75rem]"
};

export function WeatherCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const showHourly = footprint === "2x2" || footprint === "4x2" || footprint === "4x4";
  const visibleHours = footprint === "4x4" ? 8 : 6;

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-white/72">Loading...</p>
      </WeatherWidgetFrame>
    );
  }

  if (error && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs leading-4 text-rose-100">{error}</p>
      </WeatherWidgetFrame>
    );
  }

  if (!data) {
    return null;
  }

  const high = Math.round(data.current.highC ?? data.current.temperatureC);
  const low = Math.round(data.current.lowC ?? data.current.temperatureC);
  const sunset = data.details?.sunset ? formatClock(data.details.sunset) : null;

  return (
    <WeatherWidgetFrame className={footprint === "1x1" ? "p-4" : "p-4 md:p-5"} tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <WeatherHeader location={data.current.location} code={data.current.conditionCode} />

        <div className="mt-0.5 flex items-start justify-between gap-3">
          <p className={cn("font-light leading-none tracking-[-0.04em] text-white", temperatureClassNameByFootprint[footprint])}>
            {Math.round(data.current.temperatureC)}°
          </p>
          <div className="pt-1.5 text-right">
            <p className="line-clamp-2 text-[13px] font-semibold leading-[1.15] text-white/92">
              {formatConditionLabel(data.current.conditionCode, data.current.conditionLabel)}
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-white/72">
              H:{high}° L:{low}°
            </p>
            {sunset ? (
              <p className="mt-1 flex items-center justify-end gap-1 text-[12px] font-medium text-white/68">
                <Sunset aria-hidden className="h-3.5 w-3.5" />
                Sunset {sunset}
              </p>
            ) : null}
          </div>
        </div>

        {showHourly ? (
          <div className="mt-auto flex justify-between gap-1 pt-4">
            {data.hourly.slice(0, visibleHours).map((hour) => (
              <div className="flex flex-1 flex-col items-center gap-1.5 text-center" key={hour.time}>
                <span className="text-[12px] font-medium text-white/70">{hour.label}</span>
                <WeatherGlyph code={hour.conditionCode} className="h-[1.15rem] w-[1.15rem] text-white/85" />
                <span className="text-[13px] font-semibold text-white">{Math.round(hour.temperatureC ?? 0)}°</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </WeatherWidgetFrame>
  );
}
