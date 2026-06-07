import { useMemo } from "react";
import { readStorage } from "@/app/storage";
import type { CalendarEvent } from "./types";

const calendarStorageKey = "dashboard-calendar-events";

function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<CalendarEvent>;
  return typeof event.id === "string" && typeof event.title === "string" && typeof event.start === "string";
}

export function readCalendarEvents() {
  const stored = readStorage<unknown>(calendarStorageKey, []);
  return Array.isArray(stored) ? stored.filter(isCalendarEvent) : [];
}

export function useCalendarEvents() {
  return useMemo(() => readCalendarEvents(), []);
}
