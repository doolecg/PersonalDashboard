import { useMemo } from "react";
import { useCalendarEvents } from "@/features/cards/calendar/useCalendarEvents";
import { useGoogleEvents } from "@/features/cards/calendar/useGoogleEvents";

// Local (localStorage) events merged with Google Calendar events when connected.
export function usePlannerEvents() {
  const local = useCalendarEvents();
  const google = useGoogleEvents();
  return useMemo(() => [...local, ...google], [local, google]);
}
