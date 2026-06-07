import { fetchJson } from "./fetchJson.js";
const baseUrl = "https://api.open-meteo.com/v1/forecast";
function buildOpenMeteoUrl(latitude, longitude, model) {
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        timezone: "auto",
        forecast_days: "10",
        forecast_hours: "24",
        current: [
            "temperature_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
            "relative_humidity_2m",
            "pressure_msl",
            "cloud_cover",
            "visibility",
            "uv_index"
        ].join(","),
        hourly: [
            "temperature_2m",
            "apparent_temperature",
            "precipitation",
            "precipitation_probability",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
            "relative_humidity_2m",
            "pressure_msl",
            "cloud_cover",
            "visibility",
            "uv_index"
        ].join(","),
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "sunrise",
            "sunset"
        ].join(","),
        models: model
    });
    return `${baseUrl}?${params.toString()}`;
}
export async function fetchOpenMeteoUkmo(latitude, longitude) {
    return fetchJson(buildOpenMeteoUrl(latitude, longitude, "ukmo_seamless"));
}
export { buildOpenMeteoUrl };
