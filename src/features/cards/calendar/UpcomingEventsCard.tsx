import { ListChecks } from "lucide-react";
import type { CardComponentProps, CardFootprint } from "../types";
import { CalendarFrame, EventSummary } from "./CalendarShared";
import { getUpcomingEvents } from "./calendarUtils";
import { useCalendarEvents } from "./useCalendarEvents";

const eventLimitByFootprint: Record<CardFootprint, number> = {
  "1x1": 2,
  "1x2": 4,
  "2x1": 3,
  "2x2": 5,
  "4x2": 6,
  "4x4": 8
};

export function UpcomingEventsCard({ footprint }: CardComponentProps) {
  const events = useCalendarEvents();
  const upcoming = getUpcomingEvents(events, new Date(), eventLimitByFootprint[footprint]);
  const isCompact = footprint === "1x1" || footprint === "2x1";

  return (
    <CalendarFrame className={isCompact ? "p-4" : "p-4 md:p-5"}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-white/92">
            <ListChecks aria-hidden className="h-4 w-4 text-cyan-100" />
            Upcoming events
          </p>
          <span className="text-[11px] font-semibold text-white/48">{upcoming.length}</span>
        </div>
        {upcoming.length ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            {upcoming.map((event) => <EventSummary compact={isCompact} event={event} key={event.id} />)}
          </div>
        ) : (
          <div className="mt-3 flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-3 text-center">
            <p className="text-xs font-medium text-white/55">No scheduled events</p>
          </div>
        )}
      </div>
    </CalendarFrame>
  );
}
