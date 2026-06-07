import { cardBehaviorConstants } from "@/constants";
import { cn } from "@/lib/utils";
import type { CardComponentProps } from "../types";
import { WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

function formatRainAmount(precipitationMm?: number) {
  if ((precipitationMm ?? 0) < 0.05) return "0mm";
  return `${Number(precipitationMm?.toFixed(1))}mm`;
}

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

  const hours = data.hourly.slice(0, visibleHours);

  return (
    <WeatherWidgetFrame className="p-4 md:p-5" tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <WeatherForecastHeader icon={Clock} location={data.current.location} title="Hourly forecast" />
        <div
          className="mt-3 flex min-h-0 flex-1 items-stretch gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-hourly-weather-strip="true"
        >
          {hours.map((hour, index) => {
            const probability = Math.round(hour.probability ?? 0);
            return (
              <div
                className="flex w-[3.6rem] shrink-0 flex-col items-center justify-between gap-2 rounded-full border border-white/15 bg-white/[0.04] px-1 py-3 text-center"
                key={hour.time}
              >
                <div className="leading-tight">
                  <p className="text-[15px] font-semibold text-white">{Math.round(hour.temperatureC ?? 0)}°</p>
                  <p className="text-[10px] text-white/45">{formatRainAmount(hour.precipitationMm)}</p>
                </div>
                <WeatherGlyph code={hour.conditionCode} className="h-5 w-5 text-white/85" />
                <span className={`text-[11px] font-medium ${probability > 0 ? "text-sky-300" : "text-white/30"}`}>
                  {probability > 0 ? `${probability}%` : "Dry"}
                </span>
                <div className="leading-tight">
                  <p className="text-[12px] font-semibold text-white/90">{index === 0 ? "Now" : hour.label}</p>
                  <p className="text-[10px] text-white/45">{hour.conditionCode.replaceAll("_", " ")}</p>
                </div>
              </div>
            );
          })}
        </div>
    <WeatherWidgetFrame className={footprint === "4x2" ? "p-4 md:p-5" : "p-4"} tone="cloud">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <WeatherSectionLabel>Hourly Forecast</WeatherSectionLabel>
        <p className="max-w-[45%] truncate text-right text-[11px] font-semibold text-white/70">{data.current.location}</p>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.hourly.slice(0, visibleHours).map((hour) => (
          <div className={cn("flex shrink-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] bg-white/6 px-1 py-2 text-center ring-1 ring-white/8 md:px-1.5", cardWidthClassName)} key={hour.time}>
            <span className="text-[10px] text-white/60">{hour.label}</span>
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
