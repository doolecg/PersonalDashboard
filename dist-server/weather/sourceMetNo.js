import { fetchJson } from "./fetchJson.js";
export async function fetchMetNoForecast(latitude, longitude) {
    const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude)
    });
    return fetchJson(`https://api.met.no/weatherapi/locationforecast/2.0/compact?${params.toString()}`, {
        headers: {
            "User-Agent": "AuraWeather/0.1 (local dashboard)"
        }
    });
}
