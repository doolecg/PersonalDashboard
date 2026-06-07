import { CalendarDays, Clock3, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CardFootprint } from "../types";
import { WeatherWidgetFrame } from "../weather/WeatherWidgetFrame";
import {
  formatDateLabel,
  formatEventWindow,
  formatMonthLabel,
  getCalendarMonthDays,
  getEventsForDate,
  getWeekdayLabels
} from "./calendarUtils";
import type { CalendarEvent } from "./types";

const allFootprints: CardFootprint[] = ["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"];
export const calendarAllowedFootprints = allFootprints;

export function CalendarFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <WeatherWidgetFrame className={cn("p-4", className)} tone="storm">
      {children}
    </WeatherWidgetFrame>
  );
}

export function CalendarHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-white/92">
        <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-cyan-100" />
        <span className="truncate">{title}</span>
      </p>
      {meta ? <p className="shrink-0 text-right text-[11px] font-semibold text-white/55">{meta}</p> : null}
    </div>
  );
}

export function EventSummary({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-2xl border border-white/10 bg-white/[0.04]", compact ? "px-2 py-1.5" : "px-3 py-2")}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("min-w-0 truncate font-semibold text-white/92", compact ? "text-[12px]" : "text-sm")}>{event.title}</p>
        {event.category ? <span className="shrink-0 rounded-full bg-cyan-300/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100">{event.category}</span> : null}
      </div>
      <p className={cn("mt-1 flex items-center gap-1 text-white/60", compact ? "text-[10px]" : "text-xs")}>
        <Clock3 aria-hidden className="h-3 w-3 shrink-0" />
        {formatDateLabel(event.start)} / {formatEventWindow(event)}
      </p>
      {event.location ? (
        <p className={cn("mt-0.5 flex items-center gap-1 text-white/50", compact ? "text-[10px]" : "text-xs")}>
          <MapPin aria-hidden className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
      ) : null}
      {!compact && event.description ? <p className="mt-2 line-clamp-2 text-xs leading-snug text-white/66">{event.description}</p> : null}
    </div>
  );
}

type MonthGridProps = {
  events: CalendarEvent[];
  footprint: CardFootprint;
  onSelectDate?: (dateKey: string, event?: CalendarEvent) => void;
  selectedDateKey?: string;
  showEventTitles?: boolean;
  viewDate: Date;
};

export function MonthGrid({ events, footprint, onSelectDate, selectedDateKey, showEventTitles, viewDate }: MonthGridProps) {
  const isCompact = footprint === "1x1" || footprint === "1x2";
  const days = getCalendarMonthDays(viewDate);
  const weekdays = getWeekdayLabels();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5" data-calendar-footprint={footprint}>
      <div className={cn("grid grid-cols-7 text-center font-semibold uppercase text-white/38", isCompact ? "text-[8px]" : "text-[10px]")}>
        {weekdays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1">
        {days.map((day) => {
          const dayEvents = getEventsForDate(events, day.dateKey);
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDateKey === day.dateKey;
          const content = (
            <>
              <span className={cn("font-semibold", day.isToday ? "text-cyan-100" : day.isCurrentMonth ? "text-white/88" : "text-white/28")}>{day.dayOfMonth}</span>
              {hasEvents ? <span className="mt-auto h-1 w-1 rounded-full bg-orange-300" /> : null}
              {showEventTitles && dayEvents[0] ? <span className="mt-1 max-w-full truncate text-[9px] font-medium text-orange-100/80">{dayEvents[0].title}</span> : null}
            </>
          );

          const className = cn(
            "flex min-h-0 flex-col items-center rounded-xl border px-1 py-1 text-center leading-none",
            isCompact ? "text-[10px]" : "text-[12px]",
            isSelected ? "border-cyan-200/50 bg-cyan-300/12" : "border-white/8 bg-white/[0.03]",
            hasEvents && "ring-1 ring-orange-300/20"
          );

          return onSelectDate ? (
            <button
              className={className}
              data-calendar-event-day={hasEvents ? day.dateKey : undefined}
              key={day.dateKey}
              onClick={() => onSelectDate(day.dateKey, dayEvents[0])}
              type="button"
            >
              {content}
            </button>
          ) : (
            <div className={className} data-calendar-event-day={hasEvents ? day.dateKey : undefined} key={day.dateKey}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarMonthTitle({ viewDate }: { viewDate: Date }) {
  return formatMonthLabel(viewDate);
}
