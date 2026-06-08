import type { CalendarDay, CalendarEvent } from "./types";

const dayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" });
const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayHeaderFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });
const dayHeaderMonthFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function toDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCalendarMonthDays(viewDate: Date, today = new Date()): CalendarDay[] {
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      dateKey: toDateKey(date),
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
      isToday: toDateKey(date) === toDateKey(today)
    };
  });
}

export function getEventsForDate(events: CalendarEvent[], dateKey: string) {
  return events
    .filter((event) => toDateKey(event.start) === dateKey)
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
}

export function getUpcomingEvents(events: CalendarEvent[], now = new Date(), limit = 5) {
  const nowMs = now.getTime();
  return events
    .filter((event) => new Date(event.end ?? event.start).getTime() >= nowMs)
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())
    .slice(0, limit);
}

export function formatMonthLabel(date: Date) {
  return monthFormatter.format(date);
}

export function formatDateLabel(date: Date | string) {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatTimeLabel(date: Date | string) {
  return timeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatEventWindow(event: CalendarEvent) {
  if (event.allDay) return "All day";
  const start = formatTimeLabel(event.start);
  return event.end ? `${start} - ${formatTimeLabel(event.end)}` : start;
}

export function getWeekdayLabels() {
  return getCalendarMonthDays(new Date(2026, 5, 1)).slice(0, 7).map((day) => dayFormatter.format(day.date).slice(0, 2));
}

export function formatDayHeader(dateKey: string, today = new Date()): string {
  const date = new Date(`${dateKey}T12:00`);
  const sameMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  return (sameMonth ? dayHeaderFmt : dayHeaderMonthFmt).format(date);
}

export function groupEventsByDate(events: CalendarEvent[]): Array<{ dateKey: string; items: CalendarEvent[] }> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = toDateKey(event.start);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }
  return [...map.entries()].map(([dateKey, items]) => ({ dateKey, items }));
}
