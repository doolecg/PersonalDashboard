import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BellRing, Check, Plus, X } from "lucide-react";
import { getReminders, saveReminders, type Reminder } from "@/app/apiClient";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "../weather/WeatherWidgetFrame";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `rem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDue(due?: string) {
  if (!due) return "";
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

export function RemindersCard(_props: CardComponentProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => {
    let cancelled = false;
    getReminders()
      .then((items) => !cancelled && setReminders(items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function commit(next: Reminder[]) {
    setReminders(next);
    saveReminders(next).catch(() => undefined);
  }

  function addReminder(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    commit([
      ...reminders,
      { id: newId(), text: trimmed, due: due ? new Date(due).toISOString() : undefined, done: false }
    ]);
    setText("");
    setDue("");
  }

  const sorted = useMemo(
    () =>
      [...reminders].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (a.due ?? "").localeCompare(b.due ?? "");
      }),
    [reminders],
  );

  return (
    <WeatherWidgetFrame className="p-3.5" tone="storm">
      <div className="flex h-full min-h-0 flex-col gap-2">
        <p className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-white/92">
          <BellRing aria-hidden className="h-4 w-4 text-cyan-100" />
          Reminders
        </p>

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {sorted.length === 0 ? (
            <li className="text-xs text-white/55">No reminders set.</li>
          ) : (
            sorted.map((reminder) => (
              <li key={reminder.id} className="group flex items-center gap-2">
                <button
                  type="button"
                  aria-label={reminder.done ? "Mark not done" : "Mark done"}
                  aria-pressed={reminder.done}
                  onClick={() => commit(reminders.map((item) => (item.id === reminder.id ? { ...item, done: !item.done } : item)))}
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border transition ${
                    reminder.done ? "border-cyan-200/60 bg-cyan-300/80 text-slate-900" : "border-white/30 text-transparent"
                  }`}
                >
                  <Check className="h-3 w-3" />
                </button>
                <span className={`min-w-0 flex-1 truncate text-xs ${reminder.done ? "text-white/40 line-through" : "text-white/88"}`}>
                  {reminder.text}
                </span>
                {reminder.due ? <span className="shrink-0 text-[10px] font-semibold text-white/50">{formatDue(reminder.due)}</span> : null}
                <button
                  type="button"
                  aria-label="Delete reminder"
                  onClick={() => commit(reminders.filter((item) => item.id !== reminder.id))}
                  className="shrink-0 text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-rose-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))
          )}
        </ul>

        <form className="flex shrink-0 items-center gap-1.5" onSubmit={addReminder}>
          <input
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/90 placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-cyan-200/40"
            value={text}
            placeholder="Remind me to…"
            onChange={(event) => setText(event.target.value)}
            aria-label="New reminder"
          />
          <input
            type="datetime-local"
            className="w-[7.5rem] shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[10px] text-white/80 focus:outline-none focus:ring-1 focus:ring-cyan-200/40"
            value={due}
            onChange={(event) => setDue(event.target.value)}
            aria-label="Reminder time"
          />
          <button
            type="submit"
            aria-label="Add reminder"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-white/85 transition hover:bg-white/[0.12]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </WeatherWidgetFrame>
  );
}
