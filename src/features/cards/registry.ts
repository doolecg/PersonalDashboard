import type { CardDefinition } from "./types";
import { ExampleCard } from "./example/ExampleCard";
import { HourlyForecastCard } from "./weather/HourlyForecastCard";
import { PrecipitationCard } from "./weather/PrecipitationCard";
import { TenDayForecastCard } from "./weather/TenDayForecastCard";
import { WeatherCard } from "./weather/WeatherCard";
import { WeatherDetailsCard } from "./weather/WeatherDetailsCard";

export const cardRegistry: CardDefinition[] = [
  {
    id: "weather-current",
    title: "Current Weather",
    description: "Current local conditions.",
    footprint: "1x1",
    Component: WeatherCard
  },
  {
    id: "weather-precipitation",
    title: "Precipitation",
    description: "Short-term rain outlook.",
    footprint: "2x1",
    Component: PrecipitationCard
  },
  {
    id: "weather-hourly",
    title: "Hourly Forecast",
    description: "24-hour temperature and precipitation.",
    footprint: "2x1",
    Component: HourlyForecastCard
  },
  {
    id: "weather-ten-day",
    title: "10-Day Forecast",
    description: "Longer daily outlook.",
    footprint: "1x1",
    Component: TenDayForecastCard
  },
  {
    id: "weather-details",
    title: "Weather Details",
    description: "Current weather metrics.",
    footprint: "1x1",
    Component: WeatherDetailsCard
  }
];
