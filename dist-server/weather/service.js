import { env } from "../env.js";
import { mergeWeatherSources } from "./ensemble.js";
import { normalizeMetNo, normalizeOpenMeteo } from "./normalize.js";
import { buildWeatherWidgetPayload } from "./presentation.js";
import { fetchMetNoForecast } from "./sourceMetNo.js";
import { fetchOpenMeteoIcon } from "./sourceOpenMeteoIcon.js";
import { fetchOpenMeteoUkmo } from "./sourceOpenMeteoUkmo.js";
let cached = null;
export async function getWeatherWidgetPayload() {
    if (cached && cached.expiresAt > Date.now()) {
        return cached.payload;
    }
    try {
        const [ukmo, metno, icon] = await Promise.allSettled([
            fetchOpenMeteoUkmo(env.defaultLat, env.defaultLon),
            fetchMetNoForecast(env.defaultLat, env.defaultLon),
            fetchOpenMeteoIcon(env.defaultLat, env.defaultLon)
        ]);
        const normalized = [
            ukmo.status === "fulfilled" ? normalizeOpenMeteo(ukmo.value, "open-meteo-ukmo", env.defaultCity) : null,
            metno.status === "fulfilled" ? normalizeMetNo(metno.value, env.defaultCity, env.defaultLat, env.defaultLon) : null,
            icon.status === "fulfilled" ? normalizeOpenMeteo(icon.value, "open-meteo-icon", env.defaultCity) : null
        ].filter((source) => source !== null);
        if (!normalized.length) {
            throw new Error("All weather providers failed");
        }
        const payload = buildWeatherWidgetPayload(mergeWeatherSources(normalized));
        cached = { expiresAt: Date.now() + (5 * 60 * 1000), payload };
        return payload;
    }
    catch (error) {
        if (cached) {
            return cached.payload;
        }
        throw error;
    }
}
