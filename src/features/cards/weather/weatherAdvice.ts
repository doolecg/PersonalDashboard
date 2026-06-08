import type { WeatherWidgetPayload } from "./types";

// A short, practical "what to wear / what to bring" line from the day's weather:
// umbrella, coat vs shorts-and-t-shirt, and sun cream.
export function buildWeatherAdvice(weather: WeatherWidgetPayload): string {
  const tips: string[] = [];
  const high = weather.current.highC ?? weather.current.temperatureC;
  const next12 = weather.precipitation.points.slice(0, 12);
  const rainLikely =
    next12.some((point) => point.probability >= 50 || point.precipitationMm >= 0.3) ||
    /rain|drizzle|shower|thunder|sleet|snow/i.test(weather.current.conditionCode);
  const uv = weather.details.uvIndex ?? 0;

  if (rainLikely) tips.push("take an umbrella");

  if (high <= 8) tips.push("wrap up warm with a coat");
  else if (high <= 16) tips.push("a jacket or light coat");
  else if (high >= 23) tips.push("shorts and t-shirt weather");
  else tips.push("a light layer should do");

  if (uv >= 6) tips.push("wear sun cream");
  else if (uv >= 3 && !rainLikely) tips.push("a little sun cream wouldn't hurt");

  return tips.join(", ");
}
