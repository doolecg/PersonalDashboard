import type { WeatherWarning, WeatherWidgetPayload } from "./types";
import { kmhToMph } from "./weatherPresentation";

export type WeatherAlert = WeatherWarning;


/** Fallback: derive synthetic alerts from weather data when Met Office warnings are unavailable. */
export function deriveAlerts(data: WeatherWidgetPayload): WeatherAlert[] {
  if (data.warnings.length) return data.warnings;

  const alerts: WeatherAlert[] = [];
  const windMph = kmhToMph(data.details.windKmh);

  if (windMph >= 55) alerts.push({ message: `Amber warning: Wind (~${windMph} mph)`, severity: "amber", type: "Wind" });
  else if (windMph >= 40) alerts.push({ message: `Yellow warning: Wind (~${windMph} mph)`, severity: "yellow", type: "Wind" });

  const next24 = data.precipitation.points.slice(0, 24);
  if (next24.some((p) => p.precipitationMm >= 7.6))
    alerts.push({ message: "Yellow warning: Heavy rain expected", severity: "yellow", type: "Rain" });

  const code = `${data.current.conditionCode} ${data.current.conditionLabel}`.toLowerCase();
  if (code.includes("thunder") || code.includes("storm"))
    alerts.push({ message: "Amber warning: Thunderstorms possible", severity: "amber", type: "Thunderstorm" });
  if (code.includes("snow") || code.includes("sleet") || code.includes("ice"))
    alerts.push({ message: "Amber warning: Snow, sleet or ice", severity: "amber", type: "Snow" });

  return alerts;
}
