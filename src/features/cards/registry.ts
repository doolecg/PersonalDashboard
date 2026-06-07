import type { CardDefinition } from "./types";
import { CalendarMonthCard } from "./calendar/CalendarMonthCard";
import { CalendarPlannerCard } from "./calendar/CalendarPlannerCard";
import { UpcomingEventsCard } from "./calendar/UpcomingEventsCard";
import { NotesCard } from "./notes/NotesCard";
import { RemindersCard } from "./reminders/RemindersCard";
import { TodoCard } from "./todo/TodoCard";
import { AiWeatherReportCard } from "./weather/AiWeatherReportCard";
import { HourlyForecastCard } from "./weather/HourlyForecastCard";
import { PrecipitationCard } from "./weather/PrecipitationCard";
import { TenDayForecastCard } from "./weather/TenDayForecastCard";
import { WeatherCard } from "./weather/WeatherCard";
import { WeatherDetailsCard } from "./weather/WeatherDetailsCard";
import { WeatherInsightCard } from "./weather/WeatherInsightCard";
import { WeatherMapCard } from "./weather/WeatherMapCard";

export const cardRegistry: CardDefinition[] = [
  {
    id: "calendar-month",
    title: "Calendar",
    description: "Month view with event markers.",
    footprint: "2x2",
    Component: CalendarMonthCard
  },
  {
    id: "calendar-upcoming",
    title: "Upcoming Events",
    description: "Next scheduled items.",
    footprint: "2x1",
    Component: UpcomingEventsCard
  },
  {
    id: "calendar-planner",
    title: "Calendar Planner",
    description: "Large calendar with selected event details.",
    footprint: "4x4",
    Component: CalendarPlannerCard
  },
  {
    id: "weather-current",
    title: "Current Weather",
    description: "Current local conditions.",
    footprint: "1x1",
    Component: WeatherCard
  },
  {
    id: "weather-ai-report",
    title: "AI Weather Report",
    description: "AI-written summary of the day's weather.",
    footprint: "2x1",
    Component: AiWeatherReportCard
  },
  {
    id: "weather-precipitation",
    title: "Precipitation",
    description: "Short-term rain outlook.",
    footprint: "2x1",
    Component: PrecipitationCard
  },
  {
    id: "weather-insight",
    title: "Weather Insight",
    description: "A quick trend for the days ahead.",
    footprint: "2x1",
    Component: WeatherInsightCard
  },
  {
    id: "weather-hourly",
    title: "Hourly Forecast",
    description: "Next hours at a glance.",
    footprint: "2x1",
    Component: HourlyForecastCard
  },
  {
    id: "weather-ten-day",
    title: "10-Day Forecast",
    description: "Daily outlook for the week ahead.",
    footprint: "2x1",
    Component: TenDayForecastCard
  },
  {
    id: "weather-map",
    title: "Weather Map",
    description: "Your location on the map.",
    footprint: "2x2",
    Component: WeatherMapCard
  },
  {
    id: "weather-details",
    title: "Weather Details",
    description: "Current weather metrics.",
    footprint: "1x1",
    Component: WeatherDetailsCard
  },
  {
    id: "notes",
    title: "Notes",
    description: "A quick free-form notepad.",
    footprint: "2x2",
    Component: NotesCard
  },
  {
    id: "todo",
    title: "To-do",
    description: "A simple task checklist.",
    footprint: "2x2",
    Component: TodoCard
  },
  {
    id: "reminders",
    title: "Reminders",
    description: "Time-based reminders.",
    footprint: "2x1",
    Component: RemindersCard
  }
];

export const cardsById: Record<string, CardDefinition> = Object.fromEntries(
  cardRegistry.map((card) => [card.id, card])
);
