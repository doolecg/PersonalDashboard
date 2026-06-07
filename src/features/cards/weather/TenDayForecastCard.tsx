import { CalendarDays } from "lucide-react";
import { cardBehaviorConstants } from "@/constants";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { WeatherForecastHeader, WeatherGlyph } from "./weatherGlyph";
import { useWeatherData } from "./useWeatherData";

function formatDayDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit" }).format(parsed);
}

export function TenDayForecastCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-white/72">Loading days...</p>
      </WeatherWidgetFrame>
    );
  }

  if (error && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-rose-100">{error}</p>
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
