import { CloudSun, ShieldCheck, AlertTriangle } from "lucide-react";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import type { WeatherWidgetPayload } from "@/features/cards/weather/types";
import { WeatherGlyph } from "@/features/cards/weather/weatherGlyph";
import { deriveAlerts } from "@/features/cards/weather/weatherAlerts";
import { Card } from "./ui";

function ForecastLine({ days }: { days: WeatherWidgetPayload["daily"] }) {
  return (
    <div className="wf-row">
      {days.slice(0, 7).map((day) => (
        <div className="wf-day" key={day.date}>
          <span className="wf-name">{day.label}</span>
          <WeatherGlyph code={day.conditionCode} className="h-4 w-4 text-white/85" />
          <span className="wf-hi">{typeof day.highC === "number" ? `${Math.round(day.highC)}°` : "–"}</span>
          <span className="wf-lo">{typeof day.lowC === "number" ? `${Math.round(day.lowC)}°` : ""}</span>
        </div>
      ))}
    </div>
  );
}

export function WeatherSmallCard() {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return <Card className="w-weather fill"><p className="muted">Loading weather…</p></Card>;
  }
  if (!data) {
    return <Card className="w-weather fill"><p className="muted">{error ?? "Weather unavailable"}</p></Card>;
  }

  const { current, daily } = data;
  const alerts = deriveAlerts(data);

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
        <CloudSun size={48} strokeWidth={1.4} style={{ opacity: 0.92 }} />
      </div>

      <div className="weather-section">
        <p className="weather-section-label">7-day forecast</p>
        <ForecastLine days={daily} />
      </div>

      {alerts.length > 0 ? (
        <div className="weather-warnings alert" style={{ marginTop: 12 }}>
          {alerts.map((alert) => (
            <div className={`ww-item ww-${alert.severity}`} key={alert.message}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="weather-warnings ok" style={{ marginTop: 12 }}>
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          No warnings.
        </div>
      )}
    </Card>
  );
}
