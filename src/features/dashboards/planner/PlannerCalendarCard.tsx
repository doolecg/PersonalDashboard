import { Calendar } from "lucide-react";
import { formatTimeLabel, getUpcomingEvents } from "@/features/cards/calendar/calendarUtils";
import { Card, CardHead } from "./ui";
import { usePlannerEvents } from "./usePlannerEvents";

export function PlannerCalendarCard() {
  const events = usePlannerEvents();
  const upcoming = getUpcomingEvents(events, new Date(), 6);

  return (
    <Card className="w-cal fill">
      <CardHead
        icon={<Calendar size={15} />}
        title="Upcoming"
        action={<span className="cal-count">{upcoming.length ? `${upcoming.length} events` : "Clear"}</span>}
      />
      {upcoming.length === 0 ? (
        <p className="muted">Nothing scheduled. Connect Google Calendar in Settings.</p>
      ) : (
        <div className="cal-list">
          {upcoming.map((event) => (
            <div className="cal-row" key={event.id}>
              <span className="cal-time">{formatTimeLabel(event.start)}</span>
              <span className="cal-bar" style={{ background: event.category ? "#5E5CE6" : "#0A84FF" }} />
              <div>
                <div className="cal-title">{event.title}</div>
                {event.category || event.location ? (
                  <div className="cal-meta">{[event.category, event.location].filter(Boolean).join(" · ")}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
