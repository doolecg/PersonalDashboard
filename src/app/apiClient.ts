import type { AiRoutingMode, AiUsageSnapshot } from "../types/models";
import type { DashboardLocation } from "@/app/preferences/preferences";
import type { WeatherReport, WeatherWidgetPayload } from "@/features/cards/weather/types";

export type GeocodeLocationResult = DashboardLocation & {
  admin1?: string;
  country?: string;
  label: string;
};

function withWeatherLocation(path: string, location?: DashboardLocation | null) {
  if (!location) return path;

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    city: location.name
  });

  return `${path}?${params.toString()}`;
}

export async function getAiStatus(): Promise<AiUsageSnapshot> {
  const response = await fetch("/api/ai/status");
  if (!response.ok) throw new Error(`AI status failed with ${response.status}`);
  return response.json() as Promise<AiUsageSnapshot>;
}

export async function setAiMode(mode: AiRoutingMode): Promise<AiUsageSnapshot> {
  const response = await fetch("/api/ai/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode })
  });
  if (!response.ok) throw new Error(`AI mode failed with ${response.status}`);
  return response.json() as Promise<AiUsageSnapshot>;
}

export async function getWeatherData(location?: DashboardLocation | null): Promise<WeatherWidgetPayload> {
  const response = await fetch(withWeatherLocation("/api/weather", location));
  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);
  return response.json() as Promise<WeatherWidgetPayload>;
}

export async function getWeatherReport(location?: DashboardLocation | null): Promise<WeatherReport> {
  const response = await fetch(withWeatherLocation("/api/weather/report", location));
  if (!response.ok) throw new Error(`Weather report failed with ${response.status}`);
  return response.json() as Promise<WeatherReport>;
}

export async function geocodeLocation(query: string): Promise<GeocodeLocationResult[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/weather/geocode?${params.toString()}`);
  if (!response.ok) throw new Error(`Location search failed with ${response.status}`);
  const payload = (await response.json()) as { results?: GeocodeLocationResult[] };
  return payload.results ?? [];
}
