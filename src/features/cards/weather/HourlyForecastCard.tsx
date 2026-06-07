import { WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function HourlyForecastCard() {
  const { data, error, loading } = useWeatherData();

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
    <WeatherWidgetFrame className="p-4 md:p-5" tone="cloud">
      <WeatherSectionLabel>Hourly Forecast</WeatherSectionLabel>
      <div className="mt-3 grid min-h-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(data.hourly.length, 1)}, minmax(0, 1fr))` }}>
        {data.hourly.map((hour) => (
          <div className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] bg-white/6 px-1 py-2 text-center ring-1 ring-white/8 md:px-1.5" key={hour.time}>
            <span className="text-[10px] text-white/60">{hour.label}</span>
            <span className="text-base font-light text-white md:text-xl">{Math.round(hour.temperatureC ?? 0)}°</span>
            <span className="line-clamp-2 text-[9px] leading-tight text-white/70 md:text-[10px]">
              {formatConditionLabel(hour.conditionCode)}
            </span>
            <span className="text-[10px] text-sky-200/90">{Math.round(hour.probability ?? 0)}%</span>
          </div>
        ))}
      </div>
    </WeatherWidgetFrame>
  );
}
