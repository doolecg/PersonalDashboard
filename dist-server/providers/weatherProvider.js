import { env } from "../env.js";
import { openMeteoWeather } from "../adapters/openMeteoWeatherProvider.js";
import { emptyWeather } from "./emptyData.js";
import { providerResult } from "./providerResult.js";
export async function getWeather(lat = env.defaultLat, lon = env.defaultLon) {
    if (env.weatherProvider === "none" || env.weatherProvider === "disabled")
        return providerResult("empty", emptyWeather, "Weather provider disabled");
    try {
        const data = await openMeteoWeather(lat, lon);
        return providerResult("ok", data);
    }
    catch (error) {
        return providerResult("error", emptyWeather, error instanceof Error ? error.message : "Weather unavailable", "weather");
    }
}
