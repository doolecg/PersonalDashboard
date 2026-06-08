import { useEffect, useState, type FormEvent } from "react";
import { Check, ListTodo, Plus, X } from "lucide-react";
import { getTodos, saveTodos, type Todo } from "@/app/apiClient";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "../weather/WeatherWidgetFrame";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TodoCard(_props: CardComponentProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTodos()
      .then((items) => !cancelled && setTodos(items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // Optimistic update + persist the whole list.
  function commit(next: Todo[]) {
    setTodos(next);
    saveTodos(next).catch(() => undefined);
  }

  function addTodo(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    commit([...todos, { id: newId(), text, done: false, createdAt: new Date().toISOString() }]);
    setDraft("");
  }

  function toggle(id: string) {
    commit(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  }

  function remove(id: string) {
    commit(todos.filter((todo) => todo.id !== id));
  }

  function startEdit(id: string, text: string) {
    setEditingId(id);
    setEditText(text);
  }

  function saveEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    commit(todos.map((todo) => (todo.id === id ? { ...todo, text: trimmed } : todo)));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  const remaining = todos.filter((todo) => !todo.done).length;

  return (
    <WeatherWidgetFrame className="p-4" tone="storm">
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-white/92">
            <ListTodo aria-hidden className="h-4 w-4 text-cyan-100" />
            To-do
          </p>
          <span className="text-[11px] font-semibold text-white/55">{remaining} left</span>
        </div>

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {todos.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
              Nothing yet — add a task below.
            </li>
          ) : (
            todos.map((todo) => (
              <li
                key={todo.id}
                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5"
              >
                <button
                  type="button"
                  aria-label={todo.done ? "Mark not done" : "Mark done"}
                  aria-pressed={todo.done}
                  onClick={() => toggle(todo.id)}
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border transition ${
                    todo.done ? "border-cyan-200/60 bg-cyan-300/80 text-slate-900" : "border-white/30 text-transparent"
                  }`}
                >
                  <Check className="h-3 w-3" />
                </button>
                {editingId === todo.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveEdit(todo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(todo.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="min-w-0 flex-1 rounded px-1 bg-white/20 text-sm text-white/90 outline-none"
                  />
                ) : (
                  <span
                    onClick={() => !todo.done && startEdit(todo.id, todo.text)}
                    className={`min-w-0 flex-1 truncate text-sm cursor-pointer ${
                      todo.done ? "text-white/40 line-through" : "text-white/88 hover:text-white"
                    }`}
                  >
                    {todo.text}
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Delete task"
                  onClick={() => remove(todo.id)}
                  className="shrink-0 text-white/30 opacity-0 transition group-hover:opacity-100 hover:text-rose-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>

        <form className="flex shrink-0 items-center gap-2" onSubmit={addTodo}>
          <input
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-cyan-200/40"
            value={draft}
            placeholder="Add a task"
            onChange={(event) => setDraft(event.target.value)}
            aria-label="New task"
          />
          <button
            type="submit"
            aria-label="Add task"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white/85 transition hover:bg-white/[0.12]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    </WeatherWidgetFrame>
  );
}
