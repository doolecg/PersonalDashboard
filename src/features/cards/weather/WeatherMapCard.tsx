import { useEffect, useState } from "react";
import { Wind } from "lucide-react";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { kmhToMph } from "./weatherPresentation";
import type { WeatherWidgetPayload } from "./types";
import { useWeatherData } from "./useWeatherData";

declare global {
  interface Window {
    windyInit?: (options: WindyInitOptions, callback: (windyApi: WindyApi) => void) => void;
  }
}

type WindyInitOptions = {
  key: string;
  lat: number;
  lon: number;
  zoom: number;
  overlay?: string;
  level?: string;
  particlesAnim?: "on" | "off";
  verbose?: boolean;
};

type WindyApi = {
  map?: {
    dragging?: { disable: () => void };
    scrollWheelZoom?: { disable: () => void };
    doubleClickZoom?: { disable: () => void };
    touchZoom?: { disable: () => void };
    setView?: (latLon: [number, number], zoom: number) => void;
  };
  store?: {
    set: (key: string, value: unknown, opts?: unknown) => void;
  };
};

const LEAFLET_SCRIPT_URL = "https://unpkg.com/leaflet@1.4.0/dist/leaflet.js";
const WINDY_SCRIPT_URL = "https://api.windy.com/assets/map-forecast/libBoot.js";
let windyScriptPromise: Promise<void> | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));

    if (!existing) {
      document.head.appendChild(script);
    }
  });
}

function loadWindyScripts() {
  windyScriptPromise ??= loadScript(LEAFLET_SCRIPT_URL).then(() => loadScript(WINDY_SCRIPT_URL));
  return windyScriptPromise;
}

function windyApiKey() {
  return import.meta.env.VITE_WINDY_MAP_API_KEY?.trim() ?? "";
}

function windyZoom(footprint: CardComponentProps["footprint"]) {
  return footprint === "2x1" ? 5 : 6;
}

function buildWindyEmbedUrl(latitude: number, longitude: number, footprint: CardComponentProps["footprint"]) {
  const url = new URL("https://embed.windy.com/embed.html");
  url.searchParams.set("type", "map");
  url.searchParams.set("location", "coordinates");
  url.searchParams.set("metricRain", "mm");
  url.searchParams.set("metricTemp", "default");
  url.searchParams.set("metricWind", "mph");
  url.searchParams.set("zoom", String(windyZoom(footprint)));
  url.searchParams.set("overlay", "wind");
  url.searchParams.set("product", "ecmwf");
  url.searchParams.set("level", "surface");
  url.searchParams.set("lat", latitude.toFixed(3));
  url.searchParams.set("lon", longitude.toFixed(3));
  return url.toString();
}

function WindyMapOverlay({ data }: { data: WeatherWidgetPayload }) {
  const windMph = typeof data.details.windKmh === "number" ? `${kmhToMph(data.details.windKmh)}mph` : "Surface wind";

  return (
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 text-[13px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">
          <Wind aria-hidden className="h-4 w-4 text-cyan-200" />
          Windy map
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">Live forecast / OSM base</p>
      </div>
      <p className="rounded-full border border-white/12 bg-slate-950/45 px-2 py-1 text-[10px] font-semibold text-white/75 backdrop-blur">
        {data.details.windDirectionLabel ? `${data.details.windDirectionLabel} ${windMph}` : windMph}
      </p>
    </div>
  );
}

function WindyEmbedMap({ data, footprint }: { data: WeatherWidgetPayload; footprint: CardComponentProps["footprint"] }) {
  const lat = data.current.latitude;
  const lon = data.current.longitude;

  if (typeof lat !== "number" || typeof lon !== "number") {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-white/72">
        Location unavailable
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden" data-weather-map="windy-embed">
      <iframe
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={buildWindyEmbedUrl(lat, lon, footprint)}
        title={`Windy weather map for ${data.current.location}`}
      />
      <WindyMapOverlay data={data} />
    </div>
  );
}

function WindyForecastMap({ data, footprint }: { data: WeatherWidgetPayload; footprint: CardComponentProps["footprint"] }) {
  const [status, setStatus] = useState<"loading" | "ready" | "embed">("loading");
  const key = windyApiKey();
  const lat = data.current.latitude;
  const lon = data.current.longitude;

  useEffect(() => {
    if (!key || typeof lat !== "number" || typeof lon !== "number") {
      setStatus("embed");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setStatus("embed");
    }, 8000);

    loadWindyScripts()
      .then(() => {
        if (cancelled) return;
        if (!window.windyInit) {
          setStatus("embed");
          return;
        }

        window.windyInit(
          {
            key,
            lat,
            lon,
            zoom: windyZoom(footprint),
            overlay: "wind",
            level: "surface",
            particlesAnim: "on",
            verbose: false
          },
          (windyApi) => {
            if (cancelled) return;
            window.clearTimeout(fallbackTimer);
            windyApi.store?.set("overlay", "wind");
            windyApi.store?.set("level", "surface");
            windyApi.store?.set("particlesAnim", "on");
            windyApi.map?.setView?.([lat, lon], windyZoom(footprint));
            windyApi.map?.dragging?.disable();
            windyApi.map?.scrollWheelZoom?.disable();
            windyApi.map?.doubleClickZoom?.disable();
            windyApi.map?.touchZoom?.disable();
            setStatus("ready");
          }
        );
      })
      .catch(() => {
        window.clearTimeout(fallbackTimer);
        if (!cancelled) setStatus("embed");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, [footprint, key, lat, lon]);

  if (!key || status === "embed") {
    return <WindyEmbedMap data={data} footprint={footprint} />;
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden" data-weather-map="windy-api">
      <div id="windy" className="pointer-events-none h-full w-full" />
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/62 text-xs font-semibold text-white/72 backdrop-blur-sm">
          Loading Windy map...
        </div>
      ) : null}
      {status === "ready" ? <WindyMapOverlay data={data} /> : null}
    </div>
  );
}

export function WeatherMapCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-white/72">Loading map...</p>
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

  return (
    <WeatherWidgetFrame className="p-0" tone="storm">
      <WindyForecastMap data={data} footprint={footprint} />
    </WeatherWidgetFrame>
  );
}
