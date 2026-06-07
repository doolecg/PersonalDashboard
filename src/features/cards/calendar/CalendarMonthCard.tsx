import type { CardComponentProps } from "../types";
import { CalendarFrame, CalendarHeader, CalendarMonthTitle, EventSummary, MonthGrid } from "./CalendarShared";
import { toDateKey } from "./calendarUtils";
import { useCalendarEvents } from "./useCalendarEvents";

export function CalendarMonthCard({ footprint }: CardComponentProps) {
  const events = useCalendarEvents();
  const viewDate = new Date();
  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
  const monthEvents = events.filter((event) => toDateKey(event.start).startsWith(monthKey));
  const showEventTitles = footprint === "2x2" || footprint === "4x2" || footprint === "4x4";

  return (
    <CalendarFrame className={footprint === "1x1" ? "p-3" : "p-4"}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <CalendarHeader title={CalendarMonthTitle({ viewDate })} meta={`${monthEvents.length} events`} />
        <MonthGrid events={events} footprint={footprint} showEventTitles={showEventTitles} viewDate={viewDate} />
        {showEventTitles && monthEvents[0] ? <EventSummary event={monthEvents[0]} compact /> : null}
      </div>
    </CalendarFrame>
  );
}
