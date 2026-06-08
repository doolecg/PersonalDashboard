import type { TickerItem } from "@/app/shell/types";
import type { DashboardId } from "@/features/dashboards/dashboards";
import { usePreferences } from "@/app/preferences/usePreferences";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import { WeatherGlyph } from "@/features/cards/weather/weatherGlyph";
import { kmhToMph } from "@/features/cards/weather/weatherPresentation";
import { PlannerShell } from "../planner/PlannerShell";
import {
  WindTile,
  UvTile,
  SunTile,
  FeelsLikeTile,
  PrecipTile,
  HumidityTile,
  VisibilityTile,
  PressureTile
} from "./WeatherTiles";
import "./weather.css";

export interface WeatherDashboardProps {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
}

function round(value?: number) {
  return typeof value === "number" ? Math.round(value) : "—";
}

// Bar colour deepens with rain: light cyan → blue → deep indigo/violet for heavy.
function rainColor(mm: number, prob: number): string {
  if (mm >= 4) return "linear-gradient(180deg, #5e5ce6, #3634c9)"; // heavy
  if (mm >= 1.5) return "linear-gradient(180deg, #0a84ff, #2563eb)"; // moderate
  if (mm > 0.1 || prob >= 50) return "linear-gradient(180deg, #64d2ff, #0a84ff)"; // light
  return "linear-gradient(180deg, rgba(120,200,255,0.5), rgba(80,150,255,0.4))"; // trace/dry
}

export function WeatherDashboard(props: WeatherDashboardProps) {
  const { data, loading } = useWeatherData();
  const preferences = usePreferences();

  return (
    <PlannerShell {...props}>
      <div className="wx">
        {!data ? (
          <div className="wx-empty">{loading ? "Loading weather…" : "Weather unavailable."}</div>
        ) : (
          <>
            {/* Hero — horizontal, like the general weather card */}
            <div className="wx-hero">
              <div className="wx-hero-main">
                <div className="wx-temp">{round(data.current.temperatureC)}°</div>
                <div className="wx-hero-info">
                  <div className="wx-loc">{data.current.location || preferences.location?.name || "Local"}</div>
                  <div className="wx-cond">{data.current.conditionLabel}</div>
                  {(data.current.highC != null || data.current.lowC != null) && (
                    <div className="wx-range">
                      H:{round(data.current.highC)}° L:{round(data.current.lowC)}°
                    </div>
                  )}
                </div>
              </div>
              <div className="wx-hero-right">
                <WeatherGlyph code={data.current.conditionCode} className="wx-hero-glyph" />
                {data.current.summary ? <div className="wx-summary">{data.current.summary}</div> : null}
              </div>
            </div>

            {/* Hourly strip with a precipitation graph */}
            <div className="wx-card wx-hourly">
              {data.hourly.slice(0, 72).map((hour, index) => {
                const prob = hour.probability ?? 0;
                const mm = hour.precipitationMm ?? 0;
                // Bar height: probability drives it, with a floor when there's measurable rain.
                const fill = Math.max(prob, mm > 0 ? Math.min(100, mm * 40 + 20) : 0);
                return (
                  <div className="wx-hour" key={`${hour.time}-${index}`}>
                    <span className="wx-hour-label">{index === 0 ? "Now" : hour.label}</span>
                    <WeatherGlyph code={hour.conditionCode} className="wx-hour-icon" />
                    <span className="wx-hour-temp">{round(hour.temperatureC)}°</span>
                    <span className="wx-hour-pop">{prob >= 10 ? `${Math.round(prob)}%` : ""}</span>
                    <span className="wx-hour-graph">
                      <span
                        className="wx-hour-bar"
                        style={{ height: `${Math.max(3, fill)}%`, background: rainColor(mm, prob) }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bento grid */}
            <div className="wx-grid">
              {/* 10-day forecast */}
              <div className="wx-card wx-forecast">
                <div className="wx-card-title">10-Day Forecast</div>
                {data.daily.slice(0, 10).map((day, index) => {
                  const lo = day.lowC ?? 0;
                  const hi = day.highC ?? 0;
                  return (
                    <div className="wx-frow" key={`${day.date}-${index}`}>
                      <span className="wx-fday">{index === 0 ? "Today" : day.label}</span>
                      <WeatherGlyph code={day.conditionCode} className="wx-ficon" />
                      {typeof day.probability === "number" && day.probability >= 10 ? (
                        <span className="wx-fpop">{Math.round(day.probability)}%</span>
                      ) : (
                        <span className="wx-fpop" />
                      )}
                      <span className="wx-flo">{round(day.lowC)}°</span>
                      <span className="wx-fbar">
                        <span
                          className="wx-fbar-fill"
                          style={{
                            marginLeft: `${Math.max(0, Math.min(100, ((lo + 5) / 40) * 100))}%`,
                            width: `${Math.max(8, Math.min(100, ((hi - lo) / 40) * 100))}%`
                          }}
                        />
                      </span>
                      <span className="wx-fhi">{round(day.highC)}°</span>
                    </div>
                  );
                })}
              </div>

              {/* Precipitation / windy map */}
              <div className="wx-card wx-map">
                <div className="wx-card-title">Precipitation</div>
                <div className="wx-map-frame">
                  <iframe
                    title="Precipitation map"
                    src={`https://embed.windy.com/embed2.html?lat=${data.current.latitude ?? 53.373}&lon=${
                      data.current.longitude ?? -3.016
                    }&zoom=6&level=surface&overlay=rain&menu=&type=map&location=coordinates&detail=&metricWind=mph&metricTemp=%C2%B0C`}
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="wx-tiles">
                <WindTile details={data.details} />
                <UvTile uv={data.details.uvIndex} />
                <SunTile sunrise={data.details.sunrise} sunset={data.details.sunset} />
                <FeelsLikeTile feels={data.current.feelsLikeC} actual={data.current.temperatureC} />
                <PrecipTile precip={data.precipitation} />
                <HumidityTile humidity={data.details.humidityPercent} />
                <VisibilityTile visibilityKm={data.details.visibilityKm} />
                <PressureTile pressureHpa={data.details.pressureHpa} />
              </div>
            </div>

            <div className="wx-foot">
              Updated {new Date(data.meta.updatedAt).toLocaleTimeString()} · {data.meta.sourcesUsed.join(", ")} ·{" "}
              {kmhToMph(data.details.windKmh)} mph wind
            </div>
          </>
        )}
      </div>
    </PlannerShell>
  );
}
