import type { ReactNode } from "react";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { TempRange, WeatherGlyph, WeatherHeader } from "./weatherGlyph";
import { getHoursUntilPrecipitation, kmhToMph } from "./weatherPresentation";
import type { CardComponentProps } from "../types";
import { useWeatherData } from "./useWeatherData";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-white/60">{label}</span>
      <span className="flex shrink-0 items-center gap-1 font-medium text-white/92">{children}</span>
    </div>
  );
}

export function WeatherDetailsCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const isCompact = footprint === "1x1";

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-white/72">Loading details...</p>
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

  const details = data.details;
  const temperature = Math.round(data.current.temperatureC);
  const high = Math.round(data.current.highC ?? data.current.temperatureC);
  const low = Math.round(data.current.lowC ?? data.current.temperatureC);
  const feels = Math.round(data.current.feelsLikeC ?? data.current.temperatureC);
  const precipHours = getHoursUntilPrecipitation(data.precipitation.points);

  const precipRow = (
    <DetailRow label="Precip">
      <WeatherGlyph code={data.current.conditionCode} className="h-3.5 w-3.5 text-white/80" />
      {precipHours ? `${precipHours}h` : "None"}
    </DetailRow>
  );
  const windRow = <DetailRow label="Wind">{kmhToMph(details?.windKmh)} mph</DetailRow>;
  const uvRow = <DetailRow label="UV Index">{Math.round(details?.uvIndex ?? 0)}</DetailRow>;
  const feelsRow = <DetailRow label="Feels Like">{feels}°</DetailRow>;

  if (isCompact) {
    return (
      <WeatherWidgetFrame className="px-4 py-3" tone="cloud">
        <div className="flex h-full min-h-0 flex-col gap-0.5">
          <WeatherHeader location={data.current.location} code={data.current.conditionCode} />
          <TempRange temperature={temperature} high={high} low={low} temperatureClassName="text-[2rem]" />
          <div className="mt-auto space-y-0.5 text-[12px] leading-tight">
            {precipRow}
            {windRow}
            {feelsRow}
          </div>
        </div>
      </WeatherWidgetFrame>
    );
  }

  // 2x1 — short and wide: header on top, two columns below.
  return (
    <WeatherWidgetFrame className="p-4" tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <WeatherHeader location={data.current.location} code={data.current.conditionCode} />
        <div className="grid flex-1 grid-cols-2 items-center gap-x-4">
          <TempRange temperature={temperature} high={high} low={low} temperatureClassName="text-[2.85rem]" />
          <div className="space-y-1 text-[12px]">
            {precipRow}
            {windRow}
            {uvRow}
            {feelsRow}
          </div>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
