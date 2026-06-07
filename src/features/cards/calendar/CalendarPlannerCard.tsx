import { useMemo, useState } from "react";
import type { CardComponentProps } from "../types";
import { CalendarFrame, CalendarHeader, CalendarMonthTitle, EventSummary, MonthGrid } from "./CalendarShared";
import { getEventsForDate, getUpcomingEvents, toDateKey } from "./calendarUtils";
import type { CalendarEvent } from "./types";
import { useCalendarEvents } from "./useCalendarEvents";

export function CalendarPlannerCard({ footprint }: CardComponentProps) {
  const events = useCalendarEvents();
  const viewDate = new Date();
  const fallbackEvent = useMemo(() => getUpcomingEvents(events, viewDate, 1)[0] ?? null, [events, viewDate]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => fallbackEvent ? toDateKey(fallbackEvent.start) : toDateKey(viewDate));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => fallbackEvent?.id ?? null);
  const selectedDayEvents = getEventsForDate(events, selectedDateKey);
  const selectedEvent = selectedDayEvents.find((event) => event.id === selectedEventId) ?? selectedDayEvents[0] ?? fallbackEvent;
  const showEventTitles = footprint === "4x4" || footprint === "4x2";
  const isCompact = footprint === "1x1" || footprint === "2x1";

  function selectDate(dateKey: string, event?: CalendarEvent) {
    setSelectedDateKey(dateKey);
    setSelectedEventId(event?.id ?? null);
  }

  return (
    <CalendarFrame className={isCompact ? "p-3" : "p-4 md:p-5"}>
      <div className="flex h-full min-h-0 flex-col gap-3" data-calendar-planner={footprint}>
        <CalendarHeader title={CalendarMonthTitle({ viewDate })} meta={selectedDayEvents.length ? `${selectedDayEvents.length} selected` : "No events"} />
        <MonthGrid
          events={events}
          footprint={footprint}
          onSelectDate={selectDate}
          selectedDateKey={selectedDateKey}
          showEventTitles={showEventTitles}
          viewDate={viewDate}
        />
        <div className="shrink-0" data-selected-event={selectedEvent?.id ?? "none"}>
          {selectedEvent ? (
            <EventSummary compact={isCompact} event={selectedEvent} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/55">
              Select a day to inspect event details.
            </div>
          )}
        </div>
      </div>
    </CalendarFrame>
  );
}
