import { env } from "../env.js";
function conditionFromCode(code = 0) {
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
        return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code))
        return "Snow";
    if ([45, 48].includes(code))
        return "Fog";
    if ([1, 2, 3].includes(code))
        return "Cloudy";
    return "Clear";
}
function hourLabel(value, index) {
    if (index === 0)
        return "Now";
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function directionFromDegrees(value = 0) {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(value / 45) % directions.length];
}
export async function openMeteoWeather(lat, lon) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code,precipitation,pressure_msl,wind_speed_10m,wind_direction_10m");
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code,visibility");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset");
    url.searchParams.set("forecast_days", "10");
    url.searchParams.set("timezone", "auto");
    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Open-Meteo failed with ${response.status}`);
    const data = (await response.json());
    const hourly = (data.hourly?.time ?? []).slice(0, 12).map((time, index) => ({
        time: hourLabel(time, index),
        temperature: Math.round(data.hourly?.temperature_2m?.[index] ?? 0),
        precipitationChance: Math.round(data.hourly?.precipitation_probability?.[index] ?? 0),
        precipitationMm: Number((data.hourly?.precipitation?.[index] ?? 0).toFixed(1)),
        condition: conditionFromCode(data.hourly?.weather_code?.[index])
    }));
    const daily = (data.daily?.time ?? []).slice(0, 10).map((date, index) => ({
        date,
        label: index === 0 ? "Today" : new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(date)),
        high: Math.round(data.daily?.temperature_2m_max?.[index] ?? 0),
        low: Math.round(data.daily?.temperature_2m_min?.[index] ?? 0),
        precipitationChance: Math.round(data.daily?.precipitation_probability_max?.[index] ?? 0),
        precipitationMm: Number((data.daily?.precipitation_sum?.[index] ?? 0).toFixed(1)),
        condition: conditionFromCode(data.daily?.weather_code?.[index])
    }));
    return {
        city: env.defaultCity,
        temperature: Math.round(data.current?.temperature_2m ?? 0),
        condition: conditionFromCode(data.current?.weather_code),
        high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
        low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
        precipitationChance: daily[0]?.precipitationChance ?? 0,
        windSpeedMph: Math.round((data.current?.wind_speed_10m ?? 0) * 0.621371),
        windDirection: directionFromDegrees(data.current?.wind_direction_10m),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
        pressureMbar: Math.round(data.current?.pressure_msl ?? 0),
        visibilityMiles: Number(((data.hourly?.visibility?.[0] ?? 0) / 1609.344).toFixed(1)),
        uvIndex: Math.round(data.daily?.uv_index_max?.[0] ?? 0),
        sunrise: data.daily?.sunrise?.[0] ? hourLabel(data.daily.sunrise[0], 1) : "",
        sunset: data.daily?.sunset?.[0] ? hourLabel(data.daily.sunset[0], 1) : "",
        hourly,
        daily
    };
}
