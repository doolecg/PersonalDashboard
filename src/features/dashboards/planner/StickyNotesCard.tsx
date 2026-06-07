import { useEffect, useState } from "react";
import { Plus, StickyNote, X } from "lucide-react";
import { getNotes, saveNotes, type Note } from "@/app/apiClient";
import { Card, CardHead } from "./ui";

// Windows Sticky Notes-style: multiple colored notes, each with an editable
// title + body. Persisted as the shared /api/notes collection.
export const noteColors = ["#FF9F0A", "#0A84FF", "#30D158", "#FF375F", "#5E5CE6"];

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function StickyNotesCard() {
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
    <Card className="w-notes fill">
      <CardHead
        icon={<StickyNote size={15} />}
        title="Notes"
        action={
          <button className="add-plus" aria-label="Add note" onClick={add}>
            <Plus size={14} />
          </button>
        }
      />
      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="muted">No notes yet — tap + to add one.</p>
        ) : (
          notes.map((note) => (
            <div className="note" key={note.id} style={{ "--nc": note.color ?? noteColors[0] } as React.CSSProperties}>
              <button className="note-del" aria-label="Delete note" onClick={() => commit(notes.filter((item) => item.id !== note.id))}>
                <X size={14} />
              </button>
              <input
                className="note-title"
                value={note.title ?? ""}
                placeholder="Title"
                onChange={(event) => update(note.id, { title: event.target.value })}
                aria-label="Note title"
              />
              <textarea
                className="note-txt"
                value={note.text}
                placeholder="Write something…"
                rows={2}
                onChange={(event) => update(note.id, { text: event.target.value })}
                aria-label="Note text"
              />
              <div className="note-colors">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    className="note-color"
                    style={{ background: color }}
                    aria-label={`Use ${color}`}
                    onClick={() => update(note.id, { color })}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
