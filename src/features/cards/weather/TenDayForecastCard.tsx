import { WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { formatConditionLabel, getTemperatureRangeSegments } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function TenDayForecastCard() {
  const { data, error, loading } = useWeatherData();

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
    <WeatherWidgetFrame className="p-5 md:p-6" tone="clear">
      <WeatherSectionLabel>10-Day Forecast</WeatherSectionLabel>
      <div className="mt-3 space-y-2.5 md:mt-4 md:space-y-3">
        {data.daily.map((day) => {
          const range = getTemperatureRangeSegments(data.daily, day);

          return (
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2.5 md:grid-cols-[3rem_minmax(0,1fr)_auto] md:gap-3" key={day.date}>
              <span className="text-sm text-white/72">{day.label}</span>
              <div className="flex min-w-0 items-center gap-2 md:gap-3">
                <span className="min-w-0 flex-1 truncate text-[13px] text-white/68 md:text-sm">
                  {formatConditionLabel(day.conditionCode)}
                </span>
                <div className="relative h-1.5 w-16 shrink-0 rounded-full bg-white/12 md:w-24 lg:w-28">
                  <div
                    className="absolute top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-200 via-yellow-200 to-amber-300"
                    style={{ left: `${range.startPercent}%`, width: `${range.widthPercent}%` }}
                  />
                </div>
              </div>
              <span className="whitespace-nowrap text-[13px] text-white md:text-sm">
                {Math.round(day.lowC ?? 0)}° {Math.round(day.highC ?? 0)}°
              </span>
            </div>
          );
        })}
      </div>
    </WeatherWidgetFrame>
  );
}
