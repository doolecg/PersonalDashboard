import { MapPin, SunMedium } from "lucide-react";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function WeatherCard() {
  const { data, error, loading } = useWeatherData();

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
    <WeatherWidgetFrame className="p-3 md:p-3.5" tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1 text-xs font-semibold tracking-tight text-white/92">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{data.current.location}</span>
          </p>
          <SunMedium className="h-3.5 w-3.5 shrink-0 text-white/72" />
        </div>

        <div className="mt-auto min-h-0 space-y-1.5">
          <p className="text-[2.15rem] font-light leading-none tracking-[-0.08em] text-white">
            {Math.round(data.current.temperatureC)}°
          </p>
          <p className="line-clamp-2 text-[11px] font-medium leading-4 text-white/88">
            {formatConditionLabel(data.current.conditionCode, data.current.conditionLabel)}
          </p>
          <p className="text-[10px] text-white/62">
            H:{Math.round(data.current.highC ?? data.current.temperatureC)}° L:{Math.round(data.current.lowC ?? data.current.temperatureC)}°
          </p>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
