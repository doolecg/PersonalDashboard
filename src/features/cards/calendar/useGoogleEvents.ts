import { useEffect, useState } from "react";
import { getGoogleEvents, getGoogleStatus } from "@/app/apiClient";
import type { CalendarEvent } from "./types";

// Module-level cache so multiple cards share a single Google fetch.
let cache: CalendarEvent[] | null = null;
let inflight: Promise<CalendarEvent[]> | null = null;

async function load(): Promise<CalendarEvent[]> {
  try {
    const status = await getGoogleStatus();
    if (!status.connected) {
      cache = [];
      return cache;
    }
    const events = await getGoogleEvents();
    cache = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      location: event.location,
      description: event.description,
      category: event.category
    }));
    return cache;
  } catch {
    cache = cache ?? [];
    return cache;
  }
}

export function useGoogleEvents(): CalendarEvent[] {
  const [events, setEvents] = useState<CalendarEvent[]>(cache ?? []);

  useEffect(() => {
    let cancelled = false;
    if (cache) setEvents(cache);
    inflight ??= load();
    inflight
      .then((result) => {
        if (!cancelled) setEvents(result);
      })
      .finally(() => {
        inflight = null;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return events;
}
