function formatHourLabel(time) {
    return new Intl.DateTimeFormat("en-GB", { hour: "numeric" }).format(new Date(time));
}
function formatDayLabel(date) {
    return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${date}T12:00:00Z`));
}
function conditionCodeFromWeatherCode(weatherCode) {
    if (typeof weatherCode === "string")
        return weatherCode;
    if (typeof weatherCode !== "number")
        return "cloudy";
    if (weatherCode >= 80)
        return "showers";
    if (weatherCode >= 60)
        return "rain";
    if (weatherCode >= 3)
        return "cloudy";
    return "clear";
}
function conditionLabel(conditionCode) {
    switch (conditionCode) {
        case "clear":
            return "Clear";
        case "partlycloudy_day":
            return "Partly Cloudy";
        case "rain":
        case "lightrain":
            return "Rain";
        case "showers":
            return "Showers";
        default:
            return "Cloudy";
    }
}
function summaryFromPrecipitation(hourly) {
    const nextWetHour = hourly.find((point) => (point.precipitationMm ?? 0) > 0.05 || (point.precipitationProbability ?? 0) >= 40);
    if (!nextWetHour)
        return "No precipitation expected in the next four hours.";
    if (nextWetHour === hourly[0])
        return "Rain expected within the hour.";
    return "Light precipitation possible later today.";
}
// Map a rain rate (mm/h) to a 0-100 "fill" so bars stay on an absolute scale:
// light rain reads short, heavy rain fills the graph, and nothing is forced to
// 100 the way per-window normalization did. ~5mm/h counts as a full bar.
const HEAVY_RAIN_MM_PER_HOUR = 5;
function rainRateToIntensity(precipitationMm) {
    return Math.max(0, Math.min(100, Math.round((precipitationMm / HEAVY_RAIN_MM_PER_HOUR) * 100)));
}
function buildPrecipitationPoints(hourly) {
    return hourly.slice(0, 72).map((point) => ({
        time: point.time,
        label: formatHourLabel(point.time),
        precipitationMm: Number((point.precipitationMm ?? 0).toFixed(4)),
        probability: Math.round(point.precipitationProbability ?? 0),
        intensity: rainRateToIntensity(point.precipitationMm ?? 0)
    }));
}
function formatWindDirection(deg) {
    if (typeof deg !== "number")
        return undefined;
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(deg / 45) % directions.length];
}
export function buildWeatherWidgetPayload(weather, warnings = []) {
    const currentConditionCode = conditionCodeFromWeatherCode(weather.current.weatherCode);
    const today = weather.daily[0];
    const precipitationSummary = summaryFromPrecipitation(weather.hourly.slice(0, 4));
    return {
        current: {
            location: weather.location.city,
            latitude: weather.location.latitude,
            longitude: weather.location.longitude,
            temperatureC: Math.round(weather.current.temperatureC ?? 0),
            feelsLikeC: weather.current.apparentTemperatureC,
            conditionLabel: conditionLabel(currentConditionCode),
            conditionCode: currentConditionCode,
            highC: today?.highC,
            lowC: today?.lowC,
            summary: precipitationSummary
        },
        precipitation: {
            summary: precipitationSummary,
            points: buildPrecipitationPoints(weather.hourly)
        },
        hourly: weather.hourly.slice(0, 72).map((point) => ({
            time: point.time,
            label: formatHourLabel(point.time),
            temperatureC: point.temperatureC,
            precipitationMm: Number((point.precipitationMm ?? 0).toFixed(4)),
            probability: point.precipitationProbability,
            windKmh: point.windSpeedKmh,
            windDirectionDeg: point.windDirectionDeg,
            cloudCoverPercent: point.cloudCoverPercent,
            conditionCode: conditionCodeFromWeatherCode(point.weatherCode)
        })),
        daily: weather.daily.slice(0, 14).map((point) => ({
            date: point.date,
            label: formatDayLabel(point.date),
            highC: point.highC,
            lowC: point.lowC,
            probability: point.precipitationProbability,
            conditionCode: conditionCodeFromWeatherCode(point.weatherCode)
        })),
        details: {
            humidityPercent: weather.current.humidityPercent,
            windKmh: weather.current.windSpeedKmh,
            windDirectionDeg: weather.current.windDirectionDeg,
            windDirectionLabel: formatWindDirection(weather.current.windDirectionDeg),
            pressureHpa: weather.current.pressureHpa,
            visibilityKm: weather.current.visibilityKm,
            uvIndex: weather.current.uvIndex,
            sunrise: today?.sunrise,
            sunset: today?.sunset
        },
        meta: {
            updatedAt: weather.updatedAt,
            sourcesUsed: weather.sourcesUsed
        },
        warnings
    };
}
