import type { EnsembleWeather, WeatherPoint, WeatherWidgetPayload } from "./types.js";

function formatHourLabel(time: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric" }).format(new Date(time));
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${date}T12:00:00Z`));
}

function conditionCodeFromWeatherCode(weatherCode: WeatherPoint["weatherCode"]) {
  if (typeof weatherCode === "string") return weatherCode;
  if (typeof weatherCode !== "number") return "cloudy";
  if (weatherCode >= 80) return "showers";
  if (weatherCode >= 60) return "rain";
  if (weatherCode >= 3) return "cloudy";
  return "clear";
}

function conditionLabel(conditionCode: string) {
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

function summaryFromPrecipitation(hourly: EnsembleWeather["hourly"]) {
  const nextWetHour = hourly.find((point) => (point.precipitationMm ?? 0) > 0.05 || (point.precipitationProbability ?? 0) >= 40);
  if (!nextWetHour) return "No precipitation expected in the next four hours.";

  if (nextWetHour === hourly[0]) return "Rain expected within the hour.";
  return "Light precipitation possible later today.";
}

function buildPrecipitationPoints(hourly: EnsembleWeather["hourly"]) {
  const nextHours = hourly.slice(0, 4);
  const maxPrecipitation = Math.max(0.1, ...nextHours.map((point) => point.precipitationMm ?? 0));

  return nextHours.flatMap((point) => {
    const precipitationMm = point.precipitationMm ?? 0;
    const probability = point.precipitationProbability ?? 0;
    return Array.from({ length: 4 }, (_, quarterIndex) => ({
      time: `${point.time}:${quarterIndex}`,
      label: formatHourLabel(point.time),
      precipitationMm: Number((precipitationMm / 4).toFixed(3)),
      probability,
      intensity: Math.round((precipitationMm / maxPrecipitation) * 100)
    }));
  });
}

function formatWindDirection(deg?: number) {
  if (typeof deg !== "number") return undefined;
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % directions.length];
}

export function buildWeatherWidgetPayload(weather: EnsembleWeather): WeatherWidgetPayload {
  const currentConditionCode = conditionCodeFromWeatherCode(weather.current.weatherCode);
  const today = weather.daily[0];
  const precipitationSummary = summaryFromPrecipitation(weather.hourly.slice(0, 4));

  return {
    current: {
      location: weather.location.city,
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
    hourly: weather.hourly.slice(0, 24).map((point) => ({
      time: point.time,
      label: formatHourLabel(point.time),
      temperatureC: point.temperatureC,
      probability: point.precipitationProbability,
      conditionCode: conditionCodeFromWeatherCode(point.weatherCode)
    })),
    daily: weather.daily.slice(0, 10).map((point) => ({
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
    }
  };
}
