import { Sunset } from "lucide-react";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import type { CardComponentProps } from "../types";
import { useWeatherData } from "./useWeatherData";

function formatTime(value?: string) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

// Daylight fraction (0 = sunrise, 1 = sunset), clamped before/after the day.
function getDaylightFraction(sunrise?: string, sunset?: string) {
  if (!sunrise || !sunset) return 0.5;
  const start = new Date(sunrise).getTime();
  const end = new Date(sunset).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0.5;
  const now = Date.now();
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}

// Position on the quadratic arc M0 36 Q 50 -6 100 36 at parameter t.
function getArcPoint(t: number) {
  const x = 100 * t;
  const y = 36 - 84 * t + 84 * t * t;
  return { x, y };
}

export function SunsetCard(_props: CardComponentProps) {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return (
      <WeatherWidgetFrame className="p-4">
        <p className="text-xs text-white/72">Loading...</p>
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

  const sunset = formatTime(data.details?.sunset);
  const sunrise = formatTime(data.details?.sunrise);
  const fraction = getDaylightFraction(data.details?.sunrise, data.details?.sunset);
  const sun = getArcPoint(fraction);

  return (
    <WeatherWidgetFrame className="p-4" tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">
          <Sunset aria-hidden className="h-4 w-4" />
          Sunset
        </p>
        <p className="mt-1 font-light leading-none tracking-[-0.04em] text-white text-[2.6rem]">{sunset}</p>

        <div className="relative my-1.5 min-h-0 w-full flex-1">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
            <path
              d="M0 36 Q 50 -6 100 36"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="2 3"
            />
            <circle cx={sun.x} cy={sun.y} r={3.6} fill="white" />
          </svg>
        </div>

        <p className="text-[13px] font-medium text-white/72">Sunrise: {sunrise}</p>
      </div>
    </WeatherWidgetFrame>
  );
}
