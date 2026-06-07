import { geocodePlace } from "../../weather/geocode.js";
import { getWeatherWidgetPayload } from "../../weather/service.js";
import type { AssistantTool } from "./types.js";

export const weatherTool: AssistantTool = {
  name: "get_weather",
  description:
    "Get the current weather and multi-day forecast for a place. If no city is given, uses the dashboard's configured location.",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "City or place name to look up, e.g. 'Liverpool' or 'Paris, France'. Optional."
      }
    },
    additionalProperties: false
  },
  execute: async (args) => {
    const city = typeof args.city === "string" ? args.city.trim() : "";

    let location: { latitude: number; longitude: number; city: string } | undefined;
    if (city) {
      const [match] = await geocodePlace(city, 1);
      if (!match) {
        return { error: `Could not find a place called "${city}".` };
      }
      location = { latitude: match.latitude, longitude: match.longitude, city: match.label };
    }

    const payload = await getWeatherWidgetPayload(location);
    return {
      location: payload.current.location,
      temperatureC: Math.round(payload.current.temperatureC),
      feelsLikeC: payload.current.feelsLikeC,
      condition: payload.current.conditionLabel,
      highC: payload.current.highC,
      lowC: payload.current.lowC,
      summary: payload.current.summary,
      humidityPercent: payload.details.humidityPercent,
      windKmh: payload.details.windKmh,
      sunrise: payload.details.sunrise,
      sunset: payload.details.sunset,
      daily: payload.daily.slice(0, 7).map((day) => ({
        date: day.date,
        label: day.label,
        highC: day.highC,
        lowC: day.lowC,
        precipitationProbability: day.probability,
        condition: day.conditionCode
      }))
    };
  }
};
