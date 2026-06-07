import { useEffect, useState } from "react";
import { Plus, StickyNote, X } from "lucide-react";
import { getNotes, saveNotes, type Note } from "@/app/apiClient";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "../weather/WeatherWidgetFrame";

// Sticky notes shared with the Planner dashboard (same /api/notes collection).
const noteColors = ["#FF9F0A", "#0A84FF", "#30D158", "#FF375F", "#5E5CE6"];

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NotesCard(_props: CardComponentProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    let cancelled = false;
    getNotes()
      .then((items) => !cancelled && setNotes(items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function commit(next: Note[]) {
    setNotes(next);
    saveNotes(next).catch(() => undefined);
  }

  function update(id: string, patch: Partial<Note>) {
    commit(notes.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note)));
  }

  function add() {
    commit([...notes, { id: newId(), title: "New note", text: "", color: noteColors[notes.length % noteColors.length], updatedAt: new Date().toISOString() }]);
  }

  return (
    <WeatherWidgetFrame className="p-4" tone="storm">
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-white/92">
            <StickyNote aria-hidden className="h-4 w-4 text-cyan-100" />
            Notes
          </p>
          <button
            type="button"
            aria-label="Add note"
            onClick={add}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-white/85 transition hover:bg-white/[0.12]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <p className="text-xs text-white/55">No notes yet — tap + to add one.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="group relative rounded-2xl border-l-[3px] bg-white/[0.05] px-3 py-2"
                style={{ borderColor: note.color ?? noteColors[0] }}
              >
                <button
                  type="button"
                  aria-label="Delete note"
                  onClick={() => commit(notes.filter((item) => item.id !== note.id))}
                  className="absolute right-2 top-2 text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-rose-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <input
                  className="w-full bg-transparent text-sm font-semibold text-white/90 focus:outline-none"
                  value={note.title ?? ""}
                  placeholder="Title"
                  onChange={(event) => update(note.id, { title: event.target.value })}
                  aria-label="Note title"
                />
                <textarea
                  className="w-full resize-none bg-transparent text-xs text-white/70 focus:outline-none"
                  value={note.text}
                  placeholder="Write something…"
                  rows={2}
                  onChange={(event) => update(note.id, { text: event.target.value })}
                  aria-label="Note text"
                />
                <div className="mt-1 flex gap-1.5">
                  {noteColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Use ${color}`}
                      onClick={() => update(note.id, { color })}
                      className="h-3.5 w-3.5 rounded-full border border-white/30"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
