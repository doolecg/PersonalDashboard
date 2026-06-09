import { env } from "../env.js";
import { mergeWeatherSources } from "./ensemble.js";
import { fetchMetOfficeWarnings } from "./metOfficeWarnings.js";
import { normalizeMetNo, normalizeOpenMeteo } from "./normalize.js";
import { buildWeatherWidgetPayload } from "./presentation.js";
import { fetchMetNoForecast } from "./sourceMetNo.js";
import { fetchOpenMeteoIcon } from "./sourceOpenMeteoIcon.js";
import { fetchOpenMeteoUkmo } from "./sourceOpenMeteoUkmo.js";
import type { NormalizedWeatherSource, WeatherWidgetPayload } from "./types.js";

export type WeatherLocation = {
  latitude: number;
  longitude: number;
  city: string;
};

// Cache one payload per resolved location so changing the dashboard location
// does not serve a stale forecast from a different place.
const cache = new Map<string, { expiresAt: number; payload: WeatherWidgetPayload }>();

function resolveLocation(location?: Partial<WeatherLocation>): WeatherLocation {
  const latitude = Number.isFinite(location?.latitude) ? (location!.latitude as number) : env.defaultLat;
  const longitude = Number.isFinite(location?.longitude) ? (location!.longitude as number) : env.defaultLon;
  const city = location?.city?.trim() || env.defaultCity;
  return { latitude, longitude, city };
}

function cacheKey({ latitude, longitude }: WeatherLocation) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export async function getWeatherWidgetPayload(location?: Partial<WeatherLocation>): Promise<WeatherWidgetPayload> {
  const { latitude, longitude, city } = resolveLocation(location);
  const key = cacheKey({ latitude, longitude, city });
  const cached = cache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  try {
    const [ukmo, metno, icon, warnings] = await Promise.allSettled([
      fetchOpenMeteoUkmo(latitude, longitude),
      fetchMetNoForecast(latitude, longitude),
      fetchOpenMeteoIcon(latitude, longitude),
      fetchMetOfficeWarnings()
    ]);

    const normalized = [
      ukmo.status === "fulfilled" ? normalizeOpenMeteo(ukmo.value, "open-meteo-ukmo", city) : null,
      metno.status === "fulfilled" ? normalizeMetNo(metno.value, city, latitude, longitude) : null,
      icon.status === "fulfilled" ? normalizeOpenMeteo(icon.value, "open-meteo-icon", city) : null
    ].filter((source): source is NormalizedWeatherSource => source !== null);

    if (!normalized.length) {
      throw new Error("All weather providers failed");
    }

    const metOfficeWarnings = warnings.status === "fulfilled" ? warnings.value : [];
    const payload = buildWeatherWidgetPayload(mergeWeatherSources(normalized), metOfficeWarnings);
    cache.set(key, { expiresAt: Date.now() + (5 * 60 * 1000), payload });
    return payload;
  } catch (error) {
    if (cached) {
      return cached.payload;
    }
    throw error;
  }
}
