import { Wind, Sun, Sunset, Thermometer, Droplets, Eye, Gauge, CloudRain } from "lucide-react";
import type { ReactNode } from "react";
import { kmhToMph } from "@/features/cards/weather/weatherPresentation";
import type { WeatherWidgetPayload } from "@/features/cards/weather/types";

function Tile({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="wx-card wx-tile">
      <div className="wx-tile-head">
        {icon}
        <span>{label}</span>
      </div>
      <div className="wx-tile-body">{children}</div>
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function WindTile({ details }: { details: WeatherWidgetPayload["details"] }) {
  const deg = details.windDirectionDeg ?? 0;
  return (
    <Tile icon={<Wind size={13} />} label="Wind">
      <div className="wx-wind">
        <div>
          <div className="wx-big">{kmhToMph(details.windKmh)}</div>
          <div className="wx-unit">mph {details.windDirectionLabel ?? ""}</div>
        </div>
        <div className="wx-compass">
          <span className="wx-compass-needle" style={{ transform: `rotate(${deg}deg)` }} />
          <span className="wx-compass-n">N</span>
        </div>
      </div>
    </Tile>
  );
}

export function UvTile({ uv }: { uv?: number }) {
  const value = Math.round(uv ?? 0);
  const level = value >= 8 ? "Very High" : value >= 6 ? "High" : value >= 3 ? "Moderate" : "Low";
  return (
    <Tile icon={<Sun size={13} />} label="UV Index">
      <div className="wx-big">{value}</div>
      <div className="wx-unit">{level}</div>
      <div className="wx-uvbar">
        <span className="wx-uvbar-dot" style={{ left: `${Math.min(100, (value / 11) * 100)}%` }} />
      </div>
    </Tile>
  );
}

export function SunTile({ sunrise, sunset }: { sunrise?: string; sunset?: string }) {
  return (
    <Tile icon={<Sunset size={13} />} label="Sunset">
      <div className="wx-big">{formatTime(sunset)}</div>
      <div className="wx-unit">Sunrise: {formatTime(sunrise)}</div>
    </Tile>
  );
}

export function FeelsLikeTile({ feels, actual }: { feels?: number; actual: number }) {
  const value = feels ?? actual;
  const note =
    feels == null ? "" : feels < actual ? "Wind is making it feel cooler." : feels > actual ? "Humidity makes it feel warmer." : "Similar to the actual temperature.";
  return (
    <Tile icon={<Thermometer size={13} />} label="Feels Like">
      <div className="wx-big">{Math.round(value)}°</div>
      <div className="wx-unit">{note}</div>
    </Tile>
  );
}

export function PrecipTile({ precip }: { precip: WeatherWidgetPayload["precipitation"] }) {
  const total = precip.points.slice(0, 24).reduce((sum, point) => sum + (point.precipitationMm ?? 0), 0);
  return (
    <Tile icon={<CloudRain size={13} />} label="Precipitation">
      <div className="wx-big">{total.toFixed(1)} mm</div>
      <div className="wx-unit">{precip.summary || "Next 24h"}</div>
    </Tile>
  );
}

export function HumidityTile({ humidity }: { humidity?: number }) {
  return (
    <Tile icon={<Droplets size={13} />} label="Humidity">
      <div className="wx-big">{Math.round(humidity ?? 0)}%</div>
    </Tile>
  );
}

export function VisibilityTile({ visibilityKm }: { visibilityKm?: number }) {
  return (
    <Tile icon={<Eye size={13} />} label="Visibility">
      <div className="wx-big">{Math.round(visibilityKm ?? 0)}</div>
      <div className="wx-unit">km</div>
    </Tile>
  );
}

export function PressureTile({ pressureHpa }: { pressureHpa?: number }) {
  return (
    <Tile icon={<Gauge size={13} />} label="Pressure">
      <div className="wx-big">{Math.round(pressureHpa ?? 0)}</div>
      <div className="wx-unit">hPa</div>
    </Tile>
  );
}
