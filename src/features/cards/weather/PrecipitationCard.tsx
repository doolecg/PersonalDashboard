import { CloudRain } from "lucide-react";
import type { CardComponentProps, CardFootprint } from "../types";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { WeatherHeader } from "./weatherGlyph";
import {
  clampPercentage,
  findRainWindow,
  precipitationBand,
  precipitationBandHeight,
  type PrecipPoint,
} from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

function getPrecipitationBarOpacity(probability: number) {
  const normalized = Math.max(0, Math.min(probability / 100, 1));
  return Number((0.32 + normalized * 0.62).toFixed(2));
}

type GraphProps = {
  points: PrecipPoint[];
  heightClassName: string;
};

// Compact graph for the small footprints: simple intensity bars, no axis bands.
function PrecipitationGraph({ points, heightClassName }: GraphProps) {
  return (
    <div
      className={`grid items-end gap-0.5 ${heightClassName}`}
      data-precipitation-graph="next-hours"
      style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}
    >
      {points.map((point) => (
        <div data-precipitation-bar="true" key={point.time} className="flex h-full items-end">
          <div
            className="w-full rounded-t-[5px] rounded-b-sm bg-sky-300/95"
            style={{
              height: `${Math.max(4, clampPercentage(point.intensity))}%`,
              opacity: getPrecipitationBarOpacity(point.probability),
            }}
          />
        </div>
      ))}
    </div>
  );
}

const bandColor: Record<string, string> = {
  none: "bg-white/12",
  light: "bg-sky-300/80",
  moderate: "bg-sky-300/90",
  heavy: "bg-amber-300/90",
};

// Android-style banded graph: Heavy / Moderate / Light gridlines, rounded "blob"
// bars scaled to those bands, and an orange pointer pill marking rain onset.
function PrecipitationBandGraph({
  points,
  tickCount,
  heightClassName,
}: {
  points: PrecipPoint[];
  tickCount: number;
  heightClassName: string;
}) {
  const rain = findRainWindow(points);
  const count = Math.max(points.length, 1);

  return (
    <div>
      <div className={`relative flex ${heightClassName}`}>
        {/* Y-axis band labels */}
        <div className="relative w-[4.5rem] shrink-0 text-[11px] font-medium text-white/55">
          <span className="absolute left-0 top-0 -translate-y-1/2">Heavy</span>
          <span className="absolute left-0 top-1/3 -translate-y-1/2">Moderate</span>
          <span className="absolute left-0 top-2/3 -translate-y-1/2">Light</span>
        </div>

        {/* Plot area */}
        <div className="relative min-w-0 flex-1">
          {/* gridlines at the band boundaries */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 border-t border-white/10" />
            <div className="absolute inset-x-0 top-1/3 border-t border-white/10" />
            <div className="absolute inset-x-0 top-2/3 border-t border-white/10" />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
          </div>

          {/* bars */}
          <div
            className="grid h-full items-end gap-1"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {points.map((point) => {
              const band = precipitationBand(point.precipitationMm);
              const height = precipitationBandHeight(point.precipitationMm);
              const wet = band !== "none" || point.probability >= 50;
              return (
                <div key={point.time} className="flex h-full items-end justify-center">
                  <div
                    className={`w-full max-w-[1.4rem] rounded-full ${bandColor[band]}`}
                    style={{ height: `${wet ? Math.max(8, height) : 6}%`, opacity: wet ? getPrecipitationBarOpacity(point.probability) : 0.4 }}
                  />
                </div>
              );
            })}
          </div>

          {/* rain-onset pointer pill */}
          {rain ? (
            <div
              className="pointer-events-none absolute inset-y-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${((rain.startIndex + 0.5) / count) * 100}%` }}
            >
              <span className="-mt-3 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
                <CloudRain aria-hidden className="h-3 w-3" />
                {rain.startClock}
              </span>
              <span className="mt-0.5 w-px flex-1 bg-amber-300/70" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-1.5 flex justify-between pl-[4.5rem] text-[11px] font-medium leading-none text-white/45">
        {buildAxisTicks(points, tickCount).map((tick, i) => (
          <span key={tick.key} className={i === 0 ? "font-semibold text-white/85" : undefined}>
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function buildAxisTicks(points: PrecipPoint[], tickCount: number) {
  if (points.length === 0) return [];
  const count = Math.min(tickCount, points.length);
  return Array.from({ length: count }, (_, i) => {
    const idx = count <= 1 ? 0 : Math.round((i * (points.length - 1)) / (count - 1));
    return { key: idx, label: i === 0 ? "Now" : points[idx].label };
  });
}

// Evenly spaced hour ticks for the compact footprints.
function HourAxis({ points, tickCount, compact }: { points: PrecipPoint[]; tickCount: number; compact?: boolean }) {
  const ticks = buildAxisTicks(points, tickCount);
  if (ticks.length === 0) return null;

  return (
    <div className={`${compact ? "mt-1" : "mt-1.5"} flex justify-between text-[11px] font-medium leading-none text-white/45`}>
      {ticks.map((tick, i) => (
        <span key={tick.key} className={i === 0 ? "font-semibold text-white/85" : undefined}>
          {tick.label}
        </span>
      ))}
    </div>
  );
}

// A dynamic headline + subtitle describing the next rain spell.
function describeRain(points: PrecipPoint[]) {
  const rain = findRainWindow(points);
  if (!rain) {
    return { title: "No rain expected soon", subtitle: "Dry over the next few hours." };
  }

  const startHour = new Date(rain.startTime).getHours();
  const phrase =
    startHour < 12 ? "this morning" : startHour < 17 ? "this afternoon" : startHour < 21 ? "this evening" : "tonight";
  const bandWord = rain.peakBand.charAt(0).toUpperCase() + rain.peakBand.slice(1);
  const tail = rain.continues ? `continuing past ${rain.endClock}` : `until ${rain.endClock}`;

  return {
    title: `Rain expected ${phrase}`,
    subtitle: `${bandWord} rain from ${rain.startClock} ${tail}`,
  };
}

type PrecipitationWindow = { hours: number; ticks: number; label: string };
const windowByFootprint: Partial<Record<CardFootprint, PrecipitationWindow>> = {
  "1x1": { hours: 4, ticks: 2, label: "Next 4 Hours" },
  "2x1": { hours: 12, ticks: 5, label: "Next 12 Hours" },
  "2x2": { hours: 12, ticks: 5, label: "Next 12 Hours" },
  "4x4": { hours: 18, ticks: 7, label: "Next 18 Hours" },
};

export function PrecipitationCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();
  const isTiny = footprint === "1x1";
  const isExpanded = footprint === "2x2";
  const isShowcase = footprint === "4x4";

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-white/72">Loading forecast...</p>
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

  const currentTemperature = Math.round(data.current.temperatureC);
  const window = windowByFootprint[footprint] ?? { hours: 12, ticks: 5, label: "Next 12 Hours" };
  const points = data.precipitation.points.slice(0, window.hours);

  if (isShowcase || isExpanded) {
    const { title, subtitle } = describeRain(points);
    return (
      <WeatherWidgetFrame className={isShowcase ? "p-6 md:p-8" : "p-4 md:p-5"} tone="cloud">
        <div className="flex h-full min-h-0 flex-col" data-precipitation-footprint={footprint} data-precipitation-details={isShowcase ? "showcase" : "expanded"}>
          <WeatherHeader location={data.current.location} code={data.current.conditionCode} />
          <p className={`mt-2 font-semibold leading-tight text-white ${isShowcase ? "text-[22px]" : "text-[16px]"}`}>{title}</p>
          <p className={`mt-0.5 text-white/65 ${isShowcase ? "text-[15px]" : "text-[12.5px]"}`}>{subtitle}</p>
          <div className="mt-auto pt-4">
            <PrecipitationBandGraph points={points} tickCount={window.ticks} heightClassName={isShowcase ? "h-44" : "h-28"} />
          </div>
        </div>
      </WeatherWidgetFrame>
    );
  }

  if (isTiny) {
    return (
      <WeatherWidgetFrame className="p-4" tone="cloud">
        <div className="flex h-full min-h-0 flex-col" data-precipitation-footprint="1x1">
          <WeatherHeader location={data.current.location} code={data.current.conditionCode} />
          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-4 text-white/92">{data.precipitation.summary}</p>
          <div className="mt-auto">
            <PrecipitationGraph points={points} heightClassName="h-9" />
            <HourAxis points={points} tickCount={window.ticks} compact />
          </div>
        </div>
      </WeatherWidgetFrame>
    );
  }

  // 2x1 — short and wide.
  return (
    <WeatherWidgetFrame className="p-4" tone="cloud">
      <div className="flex h-full min-h-0 flex-col" data-precipitation-footprint="2x1" data-compact-precipitation-widget="true">
        <WeatherHeader location={data.current.location} code={data.current.conditionCode} />
        <div className="mt-0.5 flex items-start justify-between gap-3">
          <p className="font-light leading-none tracking-[-0.04em] text-white text-[2.6rem]">{currentTemperature}°</p>
          <p className="max-w-[58%] text-right text-[12px] font-semibold leading-[1.15] text-white/90 line-clamp-2">
            {data.precipitation.summary}
          </p>
        </div>
        <div className="mt-auto">
          <PrecipitationGraph points={points} heightClassName="h-9" />
          <HourAxis points={points} tickCount={window.ticks} />
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
