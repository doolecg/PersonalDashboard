import { CalendarDays } from "lucide-react";
import { cardBehaviorConstants } from "@/constants";
import { cn } from "@/lib/utils";
import type { CardComponentProps } from "../types";
import { WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel, getTemperatureRangeSegments } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

function formatDayDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit" }).format(parsed);
}

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

  const defaultDays = cardBehaviorConstants["weather-ten-day"].defaultVisibleDays ?? 4;
  const dayLimit = footprint === "1x1" ? defaultDays : footprint === "2x1" ? 6 : Math.min(10, data.daily.length);
  const title = data.daily.length >= 8 ? "10-day forecast" : "7-day forecast";

  return (
    <WeatherWidgetFrame className="p-4 md:p-5" tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <WeatherForecastHeader icon={CalendarDays} location={data.current.location} title={title} />
        <div className="mt-3 flex min-h-0 flex-1 items-stretch gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.daily.slice(0, dayLimit).map((day, index) => {
            const probability = Math.round(day.probability ?? 0);
            return (
              <div
                className="flex w-[3.6rem] shrink-0 flex-col items-center justify-between gap-2 rounded-full border border-white/15 bg-white/[0.04] px-1 py-3 text-center"
                key={day.date}
              >
                <div className="leading-tight">
                  <p className="text-[15px] font-semibold text-white">{Math.round(day.highC ?? 0)}°</p>
                  <p className="text-[12px] text-white/50">{Math.round(day.lowC ?? 0)}°</p>
    <WeatherWidgetFrame className={footprint === "1x1" ? "p-3.5" : footprint === "2x2" ? "p-4 md:p-[1.125rem]" : "p-5 md:p-6"} tone="clear">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <WeatherSectionLabel>10-Day Forecast</WeatherSectionLabel>
        <p className="max-w-[45%] truncate text-right text-[11px] font-semibold text-white/70">{data.current.location}</p>
      </div>
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
                <WeatherGlyph code={day.conditionCode} className="h-5 w-5 text-white/85" />
                <span className={`text-[11px] font-medium ${probability > 0 ? "text-sky-300" : "text-white/30"}`}>{probability}%</span>
                <div className="leading-tight">
                  <p className="text-[12px] font-semibold text-white/90">{index === 0 ? "Today" : day.label}</p>
                  <p className="text-[10px] text-white/45">{formatDayDate(day.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
