import type { EnsembleWeather, NormalizedWeatherSource, WeatherDailyPoint, WeatherPoint, WeatherSourceId } from "./types.js";

const sourceWeightByHorizon: Array<{ maxHours: number; weights: Record<WeatherSourceId, number> }> = [
  { maxHours: 4, weights: { "open-meteo-ukmo": 0.5, metno: 0.3, "open-meteo-icon": 0.2 } },
  { maxHours: 48, weights: { "open-meteo-ukmo": 0.4, metno: 0.3, "open-meteo-icon": 0.3 } },
  { maxHours: Number.POSITIVE_INFINITY, weights: { "open-meteo-ukmo": 0.34, metno: 0.33, "open-meteo-icon": 0.33 } }
];

function getWeights(hoursAhead: number) {
  return sourceWeightByHorizon.find((entry) => hoursAhead <= entry.maxHours)?.weights ?? sourceWeightByHorizon[0]!.weights;
}

function weightedAverage(values: Array<{ value?: number; weight: number }>) {
  const valid = values.filter((entry) => typeof entry.value === "number");
  if (!valid.length) return undefined;

  const totalWeight = valid.reduce((sum, entry) => sum + entry.weight, 0);
  return valid.reduce((sum, entry) => sum + (entry.value ?? 0) * entry.weight, 0) / totalWeight;
}

function mergeProbability(values: Array<{ value?: number; weight: number }>) {
  const valid = values.filter((entry) => typeof entry.value === "number");
  if (!valid.length) return undefined;

  const average = weightedAverage(valid);
  const max = Math.max(...valid.map((entry) => entry.value ?? 0));
  return average === undefined ? max : Math.round((average * 0.6) + (max * 0.4));
}

function valuesForTime<T extends WeatherPoint | WeatherDailyPoint>(sources: NormalizedWeatherSource[], picker: (source: NormalizedWeatherSource) => T | undefined, weights: Record<WeatherSourceId, number>) {
  return sources.map((source) => ({ value: picker(source), weight: weights[source.source] ?? 0 }));
}

function mergePoint(points: Array<{ value?: WeatherPoint; weight: number }>, fallbackTime: string): WeatherPoint {
  return {
    time: points.find((entry) => entry.value)?.value?.time ?? fallbackTime,
    temperatureC: weightedAverage(points.map(({ value, weight }) => ({ value: value?.temperatureC, weight }))),
    apparentTemperatureC: weightedAverage(points.map(({ value, weight }) => ({ value: value?.apparentTemperatureC, weight }))),
    precipitationMm: weightedAverage(points.map(({ value, weight }) => ({ value: value?.precipitationMm, weight }))),
    precipitationProbability: mergeProbability(points.map(({ value, weight }) => ({ value: value?.precipitationProbability, weight }))),
    windSpeedKmh: weightedAverage(points.map(({ value, weight }) => ({ value: value?.windSpeedKmh, weight }))),
    windDirectionDeg: weightedAverage(points.map(({ value, weight }) => ({ value: value?.windDirectionDeg, weight }))),
    windGustKmh: weightedAverage(points.map(({ value, weight }) => ({ value: value?.windGustKmh, weight }))),
    humidityPercent: weightedAverage(points.map(({ value, weight }) => ({ value: value?.humidityPercent, weight }))),
    pressureHpa: weightedAverage(points.map(({ value, weight }) => ({ value: value?.pressureHpa, weight }))),
    visibilityKm: weightedAverage(points.map(({ value, weight }) => ({ value: value?.visibilityKm, weight }))),
    cloudCoverPercent: weightedAverage(points.map(({ value, weight }) => ({ value: value?.cloudCoverPercent, weight }))),
    uvIndex: weightedAverage(points.map(({ value, weight }) => ({ value: value?.uvIndex, weight }))),
    weatherCode: points.find((entry) => entry.value?.weatherCode !== undefined)?.value?.weatherCode
  };
}

function mergeDailyPoint(points: Array<{ value?: WeatherDailyPoint; weight: number }>, fallbackDate: string): WeatherDailyPoint {
  return {
    date: points.find((entry) => entry.value)?.value?.date ?? fallbackDate,
    highC: weightedAverage(points.map(({ value, weight }) => ({ value: value?.highC, weight }))),
    lowC: weightedAverage(points.map(({ value, weight }) => ({ value: value?.lowC, weight }))),
    precipitationMm: weightedAverage(points.map(({ value, weight }) => ({ value: value?.precipitationMm, weight }))),
    precipitationProbability: mergeProbability(points.map(({ value, weight }) => ({ value: value?.precipitationProbability, weight }))),
    windSpeedKmh: weightedAverage(points.map(({ value, weight }) => ({ value: value?.windSpeedKmh, weight }))),
    sunrise: points.find((entry) => entry.value?.sunrise)?.value?.sunrise,
    sunset: points.find((entry) => entry.value?.sunset)?.value?.sunset,
    weatherCode: points.find((entry) => entry.value?.weatherCode !== undefined)?.value?.weatherCode
  };
}

export function mergeWeatherSources(sources: NormalizedWeatherSource[]): EnsembleWeather {
  if (!sources.length) {
    throw new Error("At least one weather source is required");
  }

  const location = sources[0]!.location;
  const currentWeights = getWeights(0);
  const current = mergePoint(valuesForTime(sources, (source) => source.current, currentWeights), new Date().toISOString());

  const hourlyTimes = Array.from(new Set(sources.flatMap((source) => source.hourly.map((point) => point.time)))).slice(0, 24);
  const dailyDates = Array.from(new Set(sources.flatMap((source) => source.daily.map((point) => point.date)))).slice(0, 14);

  return {
    location,
    updatedAt: new Date().toISOString(),
    sourcesUsed: sources.map((source) => source.source),
    current,
    hourly: hourlyTimes.map((time, index) => {
      const weights = getWeights(index);
      return mergePoint(valuesForTime(sources, (source) => source.hourly.find((point) => point.time === time), weights), time);
    }),
    daily: dailyDates.map((date, index) => {
      const weights = getWeights(index * 24);
      return mergeDailyPoint(valuesForTime(sources, (source) => source.daily.find((point) => point.date === date), weights), date);
    })
  };
}
