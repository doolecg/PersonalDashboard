import { env } from "../env.js";
import { mergeWeatherSources } from "./ensemble.js";
import { normalizeMetNo, normalizeOpenMeteo } from "./normalize.js";
import { buildWeatherWidgetPayload } from "./presentation.js";
import { fetchMetNoForecast } from "./sourceMetNo.js";
import { fetchOpenMeteoIcon } from "./sourceOpenMeteoIcon.js";
import { fetchOpenMeteoUkmo } from "./sourceOpenMeteoUkmo.js";
// Cache one payload per resolved location so changing the dashboard location
// does not serve a stale forecast from a different place.
const cache = new Map();
function resolveLocation(location) {
    const latitude = Number.isFinite(location?.latitude) ? location.latitude : env.defaultLat;
    const longitude = Number.isFinite(location?.longitude) ? location.longitude : env.defaultLon;
    const city = location?.city?.trim() || env.defaultCity;
    return { latitude, longitude, city };
}
function cacheKey({ latitude, longitude }) {
    return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}
export async function getWeatherWidgetPayload(location) {
    const { latitude, longitude, city } = resolveLocation(location);
    const key = cacheKey({ latitude, longitude, city });
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.payload;
    }
    try {
        const [ukmo, metno, icon] = await Promise.allSettled([
            fetchOpenMeteoUkmo(latitude, longitude),
            fetchMetNoForecast(latitude, longitude),
            fetchOpenMeteoIcon(latitude, longitude)
        ]);
        const normalized = [
            ukmo.status === "fulfilled" ? normalizeOpenMeteo(ukmo.value, "open-meteo-ukmo", city) : null,
            metno.status === "fulfilled" ? normalizeMetNo(metno.value, city, latitude, longitude) : null,
            icon.status === "fulfilled" ? normalizeOpenMeteo(icon.value, "open-meteo-icon", city) : null
        ].filter((source) => source !== null);
        if (!normalized.length) {
            throw new Error("All weather providers failed");
        }
        const payload = buildWeatherWidgetPayload(mergeWeatherSources(normalized));
        cache.set(key, { expiresAt: Date.now() + (5 * 60 * 1000), payload });
        return payload;
    }
    catch (error) {
        if (cached) {
            return cached.payload;
        }
        throw error;
    }
}
