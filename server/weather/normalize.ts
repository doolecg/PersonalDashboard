import type { NormalizedWeatherSource, WeatherDailyPoint, WeatherPoint, WeatherSourceId } from "./types.js";

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone?: string;
  current?: Record<string, unknown>;
  hourly?: Record<string, unknown>;
  daily?: Record<string, unknown>;
};

type MetNoTimeseriesEntry = {
  time: string;
  data?: {
    instant?: {
      details?: Record<string, number | undefined>;
    };
    next_1_hours?: {
      summary?: {
        symbol_code?: string;
      };
      details?: Record<string, number | undefined>;
    };
  };
};

type MetNoResponse = {
  properties?: {
    timeseries?: MetNoTimeseriesEntry[];
  };
};

const roundToSingleDecimal = (value: number) => Math.round(value * 10) / 10;

function numberAt(record: Record<string, unknown> | undefined, key: string, index?: number) {
  const value = record?.[key];
  if (Array.isArray(value)) {
    const item = typeof index === "number" ? value[index] : undefined;
    return typeof item === "number" ? item : undefined;
  }
  return typeof value === "number" ? value : undefined;
}

function stringAt(record: Record<string, unknown> | undefined, key: string, index?: number) {
  const value = record?.[key];
  if (Array.isArray(value)) {
    const item = typeof index === "number" ? value[index] : undefined;
    return typeof item === "string" ? item : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function toVisibilityKm(value?: number) {
  return typeof value === "number" ? roundToSingleDecimal(value / 1000) : undefined;
}

function toWeatherPoint(record: Record<string, unknown> | undefined, time: string, index?: number): WeatherPoint {
  return {
    time,
    temperatureC: numberAt(record, "temperature_2m", index),
    apparentTemperatureC: numberAt(record, "apparent_temperature", index),
    precipitationMm: numberAt(record, "precipitation", index),
    precipitationProbability: numberAt(record, "precipitation_probability", index),
    windSpeedKmh: numberAt(record, "wind_speed_10m", index),
    windDirectionDeg: numberAt(record, "wind_direction_10m", index),
    windGustKmh: numberAt(record, "wind_gusts_10m", index),
    humidityPercent: numberAt(record, "relative_humidity_2m", index),
    pressureHpa: numberAt(record, "pressure_msl", index),
    visibilityKm: toVisibilityKm(numberAt(record, "visibility", index)),
    cloudCoverPercent: numberAt(record, "cloud_cover", index),
    uvIndex: numberAt(record, "uv_index", index),
    weatherCode: numberAt(record, "weather_code", index)
  };
}

export function normalizeOpenMeteo(raw: OpenMeteoResponse, source: WeatherSourceId, city: string): NormalizedWeatherSource {
  const hourlyTimes = Array.isArray(raw.hourly?.time) ? raw.hourly.time.filter((time): time is string => typeof time === "string") : [];
  const dailyTimes = Array.isArray(raw.daily?.time) ? raw.daily.time.filter((time): time is string => typeof time === "string") : [];

  return {
    source,
    fetchedAt: new Date().toISOString(),
    location: {
      city,
      latitude: raw.latitude,
      longitude: raw.longitude,
      timezone: raw.timezone
    },
    current: toWeatherPoint(raw.current, stringAt(raw.current, "time") ?? hourlyTimes[0] ?? new Date().toISOString()),
    hourly: hourlyTimes.map((time, index) => toWeatherPoint(raw.hourly, time, index)),
    daily: dailyTimes.map((date, index) => ({
      date,
      highC: numberAt(raw.daily, "temperature_2m_max", index),
      lowC: numberAt(raw.daily, "temperature_2m_min", index),
      precipitationMm: numberAt(raw.daily, "precipitation_sum", index),
      precipitationProbability: numberAt(raw.daily, "precipitation_probability_max", index),
      windSpeedKmh: numberAt(raw.daily, "wind_speed_10m_max", index),
      sunrise: stringAt(raw.daily, "sunrise", index),
      sunset: stringAt(raw.daily, "sunset", index),
      weatherCode: numberAt(raw.daily, "weather_code", index)
    }))
  };
}

function aggregateDaily(hourly: WeatherPoint[]): WeatherDailyPoint[] {
  const grouped = new Map<string, WeatherPoint[]>();

  for (const point of hourly) {
    const date = point.time.slice(0, 10);
    const group = grouped.get(date) ?? [];
    group.push(point);
    grouped.set(date, group);
  }

  return Array.from(grouped.entries()).slice(0, 10).map(([date, points]) => ({
    date,
    highC: Math.max(...points.map((point) => point.temperatureC ?? -Infinity)),
    lowC: Math.min(...points.map((point) => point.temperatureC ?? Infinity)),
    precipitationMm: roundToSingleDecimal(points.reduce((sum, point) => sum + (point.precipitationMm ?? 0), 0)),
    precipitationProbability: Math.max(...points.map((point) => point.precipitationProbability ?? 0)),
    windSpeedKmh: Math.max(...points.map((point) => point.windSpeedKmh ?? 0)),
    sunrise: undefined,
    sunset: undefined,
    weatherCode: points.find((point) => point.weatherCode !== undefined)?.weatherCode
  }));
}

export function normalizeMetNo(raw: MetNoResponse, city: string, latitude: number, longitude: number): NormalizedWeatherSource {
  const timeseries = raw.properties?.timeseries ?? [];
  const hourly = timeseries.slice(0, 72).map((entry) => {
    const details = entry.data?.instant?.details ?? {};
    const nextHour = entry.data?.next_1_hours;

    return {
      time: entry.time,
      temperatureC: details.air_temperature,
      precipitationMm: nextHour?.details?.precipitation_amount,
      precipitationProbability: nextHour?.details?.probability_of_precipitation,
      windSpeedKmh: typeof details.wind_speed === "number" ? roundToSingleDecimal(details.wind_speed * 3.6) : undefined,
      windDirectionDeg: details.wind_from_direction,
      humidityPercent: details.relative_humidity,
      pressureHpa: details.air_pressure_at_sea_level,
      cloudCoverPercent: details.cloud_area_fraction,
      uvIndex: details.ultraviolet_index_clear_sky,
      weatherCode: nextHour?.summary?.symbol_code ?? "cloudy"
    } satisfies WeatherPoint;
  });

  return {
    source: "metno",
    fetchedAt: new Date().toISOString(),
    location: {
      city,
      latitude,
      longitude
    },
    current: hourly[0] ?? { time: new Date().toISOString() },
    hourly,
    daily: aggregateDaily(timeseries.map((entry) => {
      const details = entry.data?.instant?.details ?? {};
      const nextHour = entry.data?.next_1_hours;

      return {
        time: entry.time,
        temperatureC: details.air_temperature,
        precipitationMm: nextHour?.details?.precipitation_amount,
        precipitationProbability: nextHour?.details?.probability_of_precipitation,
        windSpeedKmh: typeof details.wind_speed === "number" ? roundToSingleDecimal(details.wind_speed * 3.6) : undefined,
        weatherCode: nextHour?.summary?.symbol_code ?? "cloudy"
      } satisfies WeatherPoint;
    }))
  };
}
