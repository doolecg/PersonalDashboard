import { useState, type WheelEvent } from "react";
import { AlertTriangle, CloudRain, CloudSun, ShieldCheck, ZoomIn, ZoomOut } from "lucide-react";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import type { WeatherWidgetPayload } from "@/features/cards/weather/types";
import {
  findRainWindow,
  precipitationBand,
  precipitationBandHeight,
  type PrecipPoint,
} from "@/features/cards/weather/weatherPresentation";
import { deriveAlerts } from "@/features/cards/weather/weatherAlerts";
import { WeatherGlyph } from "@/features/cards/weather/weatherGlyph";
import { Card } from "./ui";

function buildWindyEmbedUrl(latitude: number, longitude: number) {
  const url = new URL("https://embed.windy.com/embed.html");
  url.searchParams.set("type", "map");
  url.searchParams.set("location", "coordinates");
  url.searchParams.set("metricRain", "mm");
  url.searchParams.set("metricWind", "mph");
  url.searchParams.set("zoom", "6");
  url.searchParams.set("overlay", "wind");
  url.searchParams.set("product", "ecmwf");
  url.searchParams.set("level", "surface");
  url.searchParams.set("lat", latitude.toFixed(3));
  url.searchParams.set("lon", longitude.toFixed(3));
  return url.toString();
}

function ForecastLine({ days }: { days: WeatherWidgetPayload["daily"] }) {
  return (
    <div className="wf-row">
      {days.slice(0, 7).map((day) => (
        <div className="wf-day" key={day.date}>
          <span className="wf-name">{day.label}</span>
          <WeatherGlyph code={day.conditionCode} className="h-5 w-5 text-white/85" />
          <span className="wf-hi">{typeof day.highC === "number" ? `${Math.round(day.highC)}°` : "–"}</span>
          <span className="wf-lo">{typeof day.lowC === "number" ? `${Math.round(day.lowC)}°` : ""}</span>
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

function barOpacity(probability: number) {
  const normalized = Math.max(0, Math.min(probability / 100, 1));
  return Number((0.32 + normalized * 0.62).toFixed(2));
}

function buildAxisTicks(points: PrecipPoint[], tickCount: number) {
  if (points.length === 0) return [];
  const count = Math.min(tickCount, points.length);
  return Array.from({ length: count }, (_, i) => {
    const idx = count <= 1 ? 0 : Math.round((i * (points.length - 1)) / (count - 1));
    return { key: idx, label: i === 0 ? "Now" : points[idx].label };
  });
}

// Android-style banded precipitation graph (Heavy / Moderate / Light gridlines,
// rounded blob bars, orange rain-onset pill) — matches the existing
// PrecipitationCard look, sized larger for the Planner's tall weather card.
function PrecipBandGraph({ points }: { points: PrecipPoint[] }) {
  const rain = findRainWindow(points);
  const count = Math.max(points.length, 1);

  return (
    <div>
      <div className="relative flex h-32">
        <div className="relative w-[4.5rem] shrink-0 text-[11px] font-medium text-white/55">
          <span className="absolute left-0 top-0 -translate-y-1/2">Heavy</span>
          <span className="absolute left-0 top-1/3 -translate-y-1/2">Moderate</span>
          <span className="absolute left-0 top-2/3 -translate-y-1/2">Light</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 border-t border-white/10" />
            <div className="absolute inset-x-0 top-1/3 border-t border-white/10" />
            <div className="absolute inset-x-0 top-2/3 border-t border-white/10" />
            <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
          </div>
          <div className="grid h-full items-end gap-1" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {points.map((point) => {
              const band = precipitationBand(point.precipitationMm);
              const height = precipitationBandHeight(point.precipitationMm);
              const wet = band !== "none" || point.probability >= 50;
              return (
                <div key={point.time} className="flex h-full items-end justify-center">
                  <div
                    className={`w-full max-w-[1.4rem] rounded-full ${bandColor[band]}`}
                    style={{ height: `${wet ? Math.max(8, height) : 6}%`, opacity: wet ? barOpacity(point.probability) : 0.4 }}
                  />
                </div>
              );
            })}
          </div>
          {rain ? (
            <div
              className="pointer-events-none absolute inset-y-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${((rain.startIndex + 0.5) / count) * 100}%` }}
            >
              <span className="mt-1.5 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
                <CloudRain aria-hidden className="h-3 w-3" />
                {rain.startClock}
              </span>
              <span className="mt-0.5 w-px flex-1 bg-amber-300/70" />
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between pl-[4.5rem] text-[11px] font-medium leading-none text-white/45">
        {buildAxisTicks(points, 5).map((tick, i) => (
          <span key={tick.key} className={i === 0 ? "font-semibold text-white/85" : undefined}>
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeatherWarnings({ data }: { data: WeatherWidgetPayload }) {
  const alerts = deriveAlerts(data);
  if (alerts.length === 0) {
    return (
      <div className="weather-warnings ok">
        <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
        No weather warnings at the moment.
      </div>
    );
  }
  return (
    <div className="weather-warnings alert">
      {alerts.map((alert) => (
        <div className={`ww-item ww-${alert.severity}`} key={alert.message}>
          <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" />
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

const MIN_HOURS = 3;
const MAX_HOURS = 24;

export function WeatherTallCard() {
  const { data, error, loading } = useWeatherData();
  const [hours, setHours] = useState(12);

  const zoom = (delta: number) => setHours((value) => Math.max(MIN_HOURS, Math.min(MAX_HOURS, value + delta)));
  const onWheel = (event: WheelEvent<HTMLDivElement>) => zoom(event.deltaY > 0 ? 2 : -2);

  if (loading && !data) {
    return (
      <Card className="w-weather fill">
        <p className="muted">Loading weather…</p>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card className="w-weather fill">
        <p className="muted">{error ?? "Weather unavailable"}</p>
      </Card>
    );
  }

  const { current, daily, precipitation } = data;
  const lat = current.latitude;
  const lon = current.longitude;

  return (
    <Card className="w-weather fill">
      <div className="weather-top">
        <div>
          <div className="weather-temp">{Math.round(current.temperatureC)}°</div>
          <div className="weather-cond">{current.conditionLabel}</div>
          <div className="weather-sub">
            {typeof current.feelsLikeC === "number" ? `Feels ${Math.round(current.feelsLikeC)}° · ` : ""}
            {current.location}
          </div>
        </div>
        <CloudSun size={52} strokeWidth={1.4} style={{ opacity: 0.92 }} />
      </div>

      <div className="weather-section">
        <p className="weather-section-label">7-day forecast</p>
        <ForecastLine days={daily} />
      </div>

      <div className="weather-section">
        <div className="weather-section-head">
          <p className="weather-section-label">Precipitation · next {hours} hours</p>
          <div className="zoom-ctrl">
            <button type="button" aria-label="Zoom out (more hours)" onClick={() => zoom(2)} disabled={hours >= MAX_HOURS}>
              <ZoomOut size={14} />
            </button>
            <button type="button" aria-label="Zoom in (fewer hours)" onClick={() => zoom(-2)} disabled={hours <= MIN_HOURS}>
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
        <div onWheel={onWheel}>
          <PrecipBandGraph points={precipitation.points.slice(0, hours)} />
        </div>
      </div>

      {typeof lat === "number" && typeof lon === "number" ? (
        <div className="weather-map">
          <iframe
            title={`Windy map for ${current.location}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={buildWindyEmbedUrl(lat, lon)}
          />
        </div>
      ) : null}

      <WeatherWarnings data={data} />
    </Card>
  );
}
