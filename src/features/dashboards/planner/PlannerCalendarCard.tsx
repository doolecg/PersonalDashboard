import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addCalendarEvent,
  refreshCalendarEvents,
  removeCalendarEvent,
  updateCalendarEvent,
  useCalendarEvents
} from "@/features/cards/calendar/useCalendarEvents";
import {
  formatDayHeader,
  formatMonthLabel,
  formatTimeLabel,
  getCalendarMonthDays,
  getEventsForDate,
  getUpcomingEvents,
  getWeekdayLabels,
  groupEventsByDate,
  toDateKey
} from "@/features/cards/calendar/calendarUtils";
import type { CalendarEvent } from "@/features/cards/calendar/types";
import { Card, CardHead } from "./ui";
import { usePlannerEvents } from "./usePlannerEvents";
import { on } from "./plannerEvents";
import { EventModal, type EventDraft } from "./EventModal";

export function PlannerCalendarCard() {
  const events = usePlannerEvents();
  const localEvents = useCalendarEvents();

  useEffect(() => {
    const unsub = on("events-changed", () => refreshCalendarEvents());
    return unsub;
  }, []);

  const localIds = useMemo(() => new Set(localEvents.map((e) => e.id)), [localEvents]);
  const upcoming = getUpcomingEvents(events, new Date(), 12);
  const grouped = useMemo(() => groupEventsByDate(upcoming), [upcoming]);

  const viewDate = new Date();
  const days = useMemo(() => getCalendarMonthDays(viewDate), [viewDate.getMonth(), viewDate.getFullYear()]);
  const weekdays = getWeekdayLabels();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<Partial<CalendarEvent> | undefined>(undefined);

  const selectedDayEvents = selectedDay ? getEventsForDate(events, selectedDay) : [];

  function openCreate(dateKey?: string) {
    setModalInitial(dateKey ? { start: new Date(`${dateKey}T09:00`).toISOString() } : undefined);
    setModalOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    if (!localIds.has(event.id)) return;
    setModalInitial(event);
    setModalOpen(true);
  }

  function handleDayClick(dateKey: string) {
    const dayEvents = getEventsForDate(events, dateKey);
    if (dayEvents.length > 0) {
      setSelectedDay(dateKey);
    } else {
      openCreate(dateKey);
    }
  }

  function handleSave(draft: EventDraft) {
    if (draft.id) {
      updateCalendarEvent(draft.id, {
        title: draft.title,
        start: draft.start,
        end: draft.end,
        location: draft.location,
        allDay: draft.allDay
      });
    } else {
      addCalendarEvent({
        title: draft.title,
        start: draft.start,
        end: draft.end,
        location: draft.location,
        allDay: draft.allDay
      });
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    removeCalendarEvent(id);
    setModalOpen(false);
  }

  function EventRow({ event }: { event: CalendarEvent }) {
    const editable = localIds.has(event.id);
    return (
      <div className="cal-row cal-row-editable" key={event.id}>
        <span className="cal-time">{event.allDay ? "All day" : formatTimeLabel(event.start)}</span>
        <span className="cal-bar" style={{ background: event.category ? "#5E5CE6" : "#0A84FF" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="cal-title">{event.title}</div>
          {event.category || event.location ? (
            <div className="cal-meta">{[event.category, event.location].filter(Boolean).join(" · ")}</div>
          ) : null}
        </div>
        {editable ? (
          <span className="cal-actions">
            <button type="button" className="cal-action" aria-label="Edit event" onClick={() => openEdit(event)}>
              <Pencil size={13} />
            </button>
            <button
              type="button"
              className="cal-action cal-action-del"
              aria-label="Delete event"
              onClick={() => removeCalendarEvent(event.id)}
            >
              <Trash2 size={13} />
            </button>
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="w-cal fill">
      <CardHead
        icon={<Calendar size={15} />}
        title={selectedDay ? formatDayHeader(selectedDay) : formatMonthLabel(viewDate)}
        action={
          <button className="add-plus" aria-label="Add event" onClick={() => openCreate(selectedDay ?? undefined)}>
            <Plus size={14} />
          </button>
        }
      />

      {/* Month grid */}
      <div className="cal-month">
        <div className="cal-weekdays">
          {weekdays.map((day, i) => (
            <span key={`${day}-${i}`}>{day}</span>
          ))}
        </div>
        <div className="cal-grid">
          {days.map((day) => {
            const dayEvents = getEventsForDate(events, day.dateKey);
            const isSelected = selectedDay === day.dateKey;
            return (
              <button
                key={day.dateKey}
                type="button"
                className={`cal-day${day.isToday ? " today" : ""}${day.isCurrentMonth ? "" : " dim"}${isSelected ? " selected" : ""}`}
                onClick={() => handleDayClick(day.dateKey)}
                title={dayEvents.length ? dayEvents.map((e) => e.title).join(", ") : "Add event"}
              >
                <span className="cal-day-num">{day.dayOfMonth}</span>
                {dayEvents.length ? (
                  <span className="cal-day-dots">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className="cal-day-dot" />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      <div className="cal-list">
        {selectedDay ? (
          <>
            <button
              type="button"
              className="cal-back"
              onClick={() => setSelectedDay(null)}
              aria-label="Back to upcoming"
            >
              <ChevronLeft size={13} />
              <span>Upcoming</span>
            </button>
            {selectedDayEvents.length === 0 ? (
              <p className="muted">
                Nothing on {formatDayHeader(selectedDay)} —{" "}
                <button type="button" className="cal-inline-add" onClick={() => openCreate(selectedDay)}>
                  add an event
                </button>
              </p>
            ) : (
              selectedDayEvents.map((event) => <EventRow key={event.id} event={event} />)
            )}
          </>
        ) : grouped.length === 0 ? (
          <p className="muted">Nothing scheduled — tap a day or + to add.</p>
        ) : (
          grouped.map(({ dateKey, items }) => (
            <div key={dateKey} className="cal-group">
              <div className="cal-section-label">{formatDayHeader(dateKey)}</div>
              {items.map((event) => <EventRow key={event.id} event={event} />)}
            </div>
          ))
        )}
      </div>

      <EventModal
        open={modalOpen}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </Card>
  );
}
