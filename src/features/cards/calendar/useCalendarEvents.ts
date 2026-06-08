import { useSyncExternalStore } from "react";
import { getEvents, saveEvents } from "@/app/apiClient";
import { readStorage, writeStorage } from "@/app/storage";
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

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Module-level store so all calendar cards share one server-backed list and any
// add/remove (manual via the + button, or by the AI) reflects everywhere at once.
// Events live on the server (shared across devices); a legacy localStorage list is
// migrated up once on first load, then cleared.
let events: CalendarEvent[] = [];
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  void saveEvents(events).catch(() => undefined);
}

async function load() {
  let server = await getEvents().catch(() => [] as CalendarEvent[]);

  const legacy = readCalendarEvents();
  if (legacy.length) {
    const seen = new Set(server.map((event) => event.id));
    server = [...server, ...legacy.filter((event) => !seen.has(event.id))];
    await saveEvents(server).catch(() => undefined);
    writeStorage(calendarStorageKey, []);
  }

  events = server.filter(isCalendarEvent);
  emit();
}

function ensureLoaded() {
  if (!inflight) inflight = load().finally(() => undefined);
}

export function addCalendarEvent(event: Omit<CalendarEvent, "id"> & { id?: string }) {
  events = [...events, { ...event, id: event.id ?? newId() }];
  emit();
  persist();
}

export function refreshCalendarEvents() {
  inflight = null;
  events = [];
  ensureLoaded();
}

export function updateCalendarEvent(id: string, patch: Partial<Omit<CalendarEvent, "id">>) {
  events = events.map((event) => (event.id === id ? { ...event, ...patch } : event));
  emit();
  persist();
}

export function removeCalendarEvent(id: string) {
  events = events.filter((event) => event.id !== id);
  emit();
  persist();
}

export function useCalendarEvents() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      ensureLoaded();
      return () => listeners.delete(listener);
    },
    () => events,
    () => events
  );
}
