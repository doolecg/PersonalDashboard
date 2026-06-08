import { useEffect, useState } from "react";
import { Clock, MapPin, Trash2, Type, X } from "lucide-react";
import type { CalendarEvent } from "@/features/cards/calendar/types";

export type EventDraft = {
  id?: string;
  title: string;
  start: string; // ISO
  end?: string; // ISO
  location?: string;
  allDay?: boolean;
};

type EventModalProps = {
  open: boolean;
  // When editing, the existing event; when creating, a partial seed (e.g. a date).
  initial?: Partial<CalendarEvent>;
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
  onDelete?: (id: string) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

function toDateInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function toTimeInput(iso?: string, fallback = "09:00") {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventModal({ open, initial, onClose, onSave, onDelete }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");

  const editing = Boolean(initial?.id);

  // Re-seed fields whenever the modal opens with new data.
  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setAllDay(initial?.allDay ?? false);
    setStartDate(toDateInput(initial?.start));
    setStartTime(toTimeInput(initial?.start, "09:00"));
    setEndDate(toDateInput(initial?.end ?? initial?.start));
    setEndTime(toTimeInput(initial?.end, "10:00"));
    setLocation(initial?.location ?? "");
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function save() {
    const name = title.trim();
    if (!name || !startDate) return;
    const start = allDay ? new Date(`${startDate}T00:00`) : new Date(`${startDate}T${startTime}`);
    if (Number.isNaN(start.getTime())) return;
    let end: string | undefined;
    if (allDay) {
      // All-day: end is the same calendar day as start (23:59 that night)
      end = new Date(`${startDate}T23:59`).toISOString();
    } else if (endDate) {
      const endValue = new Date(`${endDate}T${endTime}`);
      if (!Number.isNaN(endValue.getTime()) && endValue > start) end = endValue.toISOString();
    }
    onSave({ id: initial?.id, title: name, start: start.toISOString(), end, location: location.trim() || undefined, allDay });
  }

  return (
    <div className="evm-overlay" onPointerDown={onClose}>
      <div className="evm glass" onPointerDown={(e) => e.stopPropagation()}>
        <div className="evm-head">
          <span className="evm-title">{editing ? "Edit event" : "New event"}</span>
          <button type="button" className="evm-x" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="evm-body">
          <input
            className="evm-title-input"
            placeholder="Add title"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="evm-row evm-allday">
            <span className="evm-row-icon">
              <Clock size={15} />
            </span>
            <span className="evm-row-label">All-day</span>
            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              className={`evm-switch${allDay ? " on" : ""}`}
              onClick={() => {
                setAllDay((v) => {
                  if (!v) {
                    // Switching to all-day: sync end date to start date
                    setEndDate(startDate);
                  }
                  return !v;
                });
              }}
            >
              <span className="evm-switch-knob" />
            </button>
          </label>

          <div className="evm-row">
            <span className="evm-row-icon">
              <Type size={15} />
            </span>
            <div className="evm-datetimes">
              <div className="evm-dt">
                <span className="evm-dt-label">{allDay ? "Date" : "Starts"}</span>
                <input type="date" value={startDate} onChange={(e) => {
                  setStartDate(e.target.value);
                  if (allDay) setEndDate(e.target.value);
                }} />
                {!allDay ? <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /> : null}
              </div>
              {!allDay && (
                <div className="evm-dt">
                  <span className="evm-dt-label">Ends</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          <div className="evm-row">
            <span className="evm-row-icon">
              <MapPin size={15} />
            </span>
            <input
              className="evm-text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="evm-foot">
          {editing && onDelete ? (
            <button type="button" className="evm-del" onClick={() => onDelete(initial!.id!)}>
              <Trash2 size={14} /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="evm-foot-right">
            <button type="button" className="evm-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="evm-save" onClick={save} disabled={!title.trim() || !startDate}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
