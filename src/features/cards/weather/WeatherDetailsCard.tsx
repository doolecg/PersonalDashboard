import { WeatherDivider, WeatherSectionLabel, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { useWeatherData } from "./useWeatherData";

function formatTime(value?: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function WeatherDetailsCard() {
  const { data, error, loading } = useWeatherData();
  const details = data?.details;

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-5">
        <p className="text-sm text-white/72">Loading details...</p>
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
    <WeatherWidgetFrame className="p-4 md:p-5" tone="clear">
      <WeatherSectionLabel>Conditions</WeatherSectionLabel>
      <div className="mt-3 grid min-h-0 flex-1 content-start gap-3 text-sm">
        <div className="min-w-0">
          <p className="text-3xl font-light tracking-tight text-white md:text-4xl">{Math.round(details?.uvIndex ?? 0)}</p>
          <p className="text-[11px] text-white/62 md:text-sm">UV index</p>
        </div>
        <WeatherDivider />
        <div className="space-y-1.5 text-[12px] text-white/80 md:text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-white/58">Humidity</span>
            <span>{Math.round(details?.humidityPercent ?? 0)}%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/58">Wind</span>
            <span>{Math.round(details?.windKmh ?? 0)} km/h</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/58">Sun</span>
            <span className="text-right leading-4">{formatTime(details?.sunrise)} / {formatTime(details?.sunset)}</span>
          </div>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
