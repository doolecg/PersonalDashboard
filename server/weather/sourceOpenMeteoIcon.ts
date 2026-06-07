import { fetchJson } from "./fetchJson.js";
import { buildOpenMeteoUrl } from "./sourceOpenMeteoUkmo.js";

type OpenMeteoApiResponse = {
  latitude: number;
  longitude: number;
  timezone?: string;
  current?: Record<string, unknown>;
  hourly?: Record<string, unknown>;
  daily?: Record<string, unknown>;
};

export async function fetchOpenMeteoIcon(latitude: number, longitude: number) {
  return fetchJson<OpenMeteoApiResponse>(buildOpenMeteoUrl(latitude, longitude, "icon_seamless"));
}
