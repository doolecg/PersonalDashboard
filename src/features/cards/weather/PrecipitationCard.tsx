import { CloudRain } from "lucide-react";
import type { CardComponentProps } from "../types";
import { WeatherDivider, WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { clampPercentage, formatPrecipitationWindowLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

function getPrecipitationBarOpacity(probability: number) {
  const normalized = Math.max(0, Math.min(probability / 100, 1));

  return Number((0.22 + normalized * 0.7).toFixed(2));
}

export function PrecipitationCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const currentTemperature = Math.round(data?.current.temperatureC ?? 0);
  const points = data?.precipitation.points ?? [];
  const labels = formatPrecipitationWindowLabel("Now", 60);
  const visiblePoints = points.slice(0, 60);
  const isTiny = footprint === "1x1";
  const isCompact = footprint === "2x1";
  const isExpanded = footprint === "2x2";
  const isShowcase = footprint === "4x4";

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-5">
        <p className="text-sm text-white/72">Loading forecast...</p>
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

  if (isTiny) {
    return (
      <WeatherWidgetFrame className="p-3" tone="storm">
        <div className="flex h-full min-h-0 flex-col" data-precipitation-footprint="1x1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold tracking-tight text-white/92">{data.current.location}</p>
              <p className="mt-0.5 font-light leading-none tracking-[-0.08em] text-white text-[2.35rem]">{currentTemperature}°</p>
            </div>
            <CloudRain className="h-4 w-4 shrink-0 text-white/72" />
          </div>
          <p className="mt-auto line-clamp-2 text-[10px] font-medium leading-3 text-white/78">{data.precipitation.summary}</p>
          <div className="mt-1.5 space-y-1">
            <p className="text-[9px] font-semibold tracking-tight text-white/48">Next-Hour Precipitation</p>
            <div className="grid h-8 items-end gap-[1px]" data-precipitation-graph="next-hour" style={{ gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(0, 1fr))` }}>
              {visiblePoints.map((point) => (
                <div data-precipitation-bar="true" key={point.time} className="flex h-full items-end">
                  <div
                    className="w-full rounded-full bg-sky-100/95"
                    style={{
                      height: `${Math.max(2, clampPercentage(point.intensity) * 0.34)}px`,
                      opacity: getPrecipitationBarOpacity(point.probability)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] leading-none text-white/45">
              <span className="font-semibold text-white/88">Now</span>
              <span>{labels.trailingLabel}</span>
            </div>
          </div>
        </div>
      </WeatherWidgetFrame>
    );
  }

  if (isCompact) {
    return (
      <WeatherWidgetFrame className="p-4 pb-3" tone="storm">
        <div className="flex h-full min-h-0 flex-col" data-compact-precipitation-widget="true" data-precipitation-footprint="2x1">
          <div className="grid h-[4.75rem] grid-cols-[6.25rem_1fr_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[13px] font-semibold leading-none tracking-tight text-white/92">
                <span className="truncate">{data.current.location}</span>
              </p>
              <p className="mt-1 font-light leading-none tracking-[-0.08em] text-white text-[3.9rem]">{currentTemperature}°</p>
            </div>
            <p className="min-w-0 pt-7 text-right text-[17px] font-semibold leading-5 text-white/92 line-clamp-1">{data.precipitation.summary}</p>
            <CloudRain className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
          </div>

          <div className="mt-auto min-h-0 space-y-1">
            <p className="text-[17px] font-semibold leading-none tracking-tight text-white/50">Next-Hour Precipitation</p>
            <div className="space-y-1" data-precipitation-rails="true">
              <WeatherDivider />
              <WeatherDivider />
              <WeatherDivider />
            </div>
            <div className="grid h-[2.35rem] items-end gap-px" data-precipitation-graph="next-hour" style={{ gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(0, 1fr))` }}>
              {visiblePoints.map((point) => (
                <div data-precipitation-bar="true" key={point.time} className="flex h-full items-end">
                  <div
                    className="w-full rounded-full bg-sky-100/95 shadow-[0_0_6px_rgba(186,230,253,0.22)]"
                    style={{
                      height: `${Math.max(2, clampPercentage(point.intensity) * 0.38)}px`,
                      opacity: getPrecipitationBarOpacity(point.probability)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-[17px] leading-none text-white/42" data-precipitation-labels="true">
              <span className="font-semibold text-white/95">Now</span>
              <span>10m</span>
              <span>20m</span>
              <span>30m</span>
              <span>40m</span>
              <span>50m</span>
              <span className="text-right">60m</span>
            </div>
          </div>
        </div>
      </WeatherWidgetFrame>
    );
  }

  if (isShowcase) {
    return (
      <WeatherWidgetFrame className="p-6 md:p-8" tone="storm">
        <div className="flex h-full min-h-0 flex-col gap-6" data-precipitation-details="showcase" data-precipitation-footprint="4x4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(14rem,0.85fr)] items-start gap-8">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-white/92">{data.current.location}</p>
              <p className="mt-2 font-light leading-none tracking-[-0.08em] text-white text-[6.25rem]">{currentTemperature}°</p>
              <p className="mt-3 max-w-sm text-[20px] font-medium leading-7 text-white/92">{data.precipitation.summary}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 text-white/70">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/46">Rain outlook</p>
                <CloudRain className="h-7 w-7 text-white/82" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <p><span className="block text-white/42">Now</span><span className="text-white/88">{Math.round(visiblePoints[0]?.probability ?? 0)}%</span></p>
                <p><span className="block text-white/42">Peak</span><span className="text-white/88">{Math.max(...visiblePoints.map((point) => point.probability))}%</span></p>
                <p><span className="block text-white/42">Window</span><span className="text-white/88">60m</span></p>
                <p><span className="block text-white/42">Bars</span><span className="text-white/88">{visiblePoints.length}</span></p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <p className="text-[15px] font-semibold tracking-tight text-white/56">Next-Hour Precipitation</p>
            <div className="space-y-3">
              <WeatherDivider />
              <WeatherDivider />
              <WeatherDivider />
            </div>
            <div className="grid h-44 items-end gap-[5px]" data-precipitation-graph="next-hour" style={{ gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(0, 1fr))` }}>
              {visiblePoints.map((point) => (
                <div data-precipitation-bar="true" key={point.time} className="flex h-full items-end">
                  <div
                    className="w-full rounded-full bg-sky-100/95 shadow-[0_0_14px_rgba(186,230,253,0.32)]"
                    style={{
                      height: `${Math.max(7, clampPercentage(point.intensity) * 1.2)}px`,
                      opacity: getPrecipitationBarOpacity(point.probability)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-[16px] leading-none text-white/45">
              <span className="font-semibold text-white/90">Now</span>
              <span>10m</span>
              <span>20m</span>
              <span>30m</span>
              <span>40m</span>
              <span>50m</span>
              <span className="text-right">{labels.trailingLabel}</span>
            </div>
          </div>
        </div>
      </WeatherWidgetFrame>
    );
  }

  return (
    <WeatherWidgetFrame className="p-5 md:p-6" tone="storm">
      <div className="flex h-full min-h-0 flex-col" data-precipitation-details={isExpanded ? "expanded" : undefined} data-precipitation-footprint={footprint}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[13px] font-semibold tracking-tight text-white/92">
            <span className="truncate">{data.current.location}</span>
          </p>
          <div className="mt-1 flex items-start gap-4">
            <p className="font-light leading-none tracking-[-0.08em] text-white text-[4.35rem]">{currentTemperature}°</p>
            <div className="pt-2">
              <p className="text-[15px] font-medium leading-5 text-white/88 md:text-[17px]">{data.precipitation.summary}</p>
            </div>
          </div>
        </div>
        <CloudRain className="mt-1 h-5 w-5 shrink-0 text-white/80" />
      </div>

      <div className="mt-3 flex-1 space-y-2.5">
        <p className="text-[11px] font-medium tracking-tight text-white/58">Next-Hour Precipitation</p>
        <div className="space-y-2">
          <WeatherDivider />
          <WeatherDivider />
        </div>
        <div className="grid h-22 items-end gap-[4px] md:h-24" data-precipitation-graph="next-hour" style={{ gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(0, 1fr))` }}>
          {visiblePoints.map((point) => (
            <div data-precipitation-bar="true" key={point.time} className="flex h-full items-end">
              <div
                className="w-full rounded-full bg-sky-200/95"
                style={{
                  height: `${Math.max(6, clampPercentage(point.intensity) * 0.6)}px`,
                  opacity: getPrecipitationBarOpacity(point.probability)
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-white/56">
          <span className="font-medium text-white/82">{labels.leadingLabel}</span>
          <span>10m</span>
          <span>20m</span>
          <span>30m</span>
          <span>40m</span>
          <span>50m</span>
          <span>{labels.trailingLabel}</span>
        </div>
      </div>
      </div>
    </WeatherWidgetFrame>
  );
}
