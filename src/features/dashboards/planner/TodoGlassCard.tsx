import { useEffect, useState, type FormEvent } from "react";
import { Check, GripVertical, ListTodo, X } from "lucide-react";
import { getTodos, saveTodos, type Todo } from "@/app/apiClient";
import { Card, CardHead } from "./ui";
import { useDragReorder } from "./useDragReorder";
import { on } from "./plannerEvents";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TodoGlassCard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [nonce, setNonce] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const unsub = on("todos-changed", () => setNonce((v) => v + 1));
    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTodos()
      .then((items) => !cancelled && setTodos(items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  function commit(next: Todo[]) {
    setTodos(next);
    saveTodos(next).catch(() => undefined);
  }

  const drag = useDragReorder(todos, setTodos, (next) => saveTodos(next).catch(() => undefined));

  function add(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    commit([...todos, { id: newId(), text, done: false, createdAt: new Date().toISOString() }]);
    setDraft("");
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
    commit(todos.map((item) => (item.id === id ? { ...item, text: trimmed } : item)));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  const left = todos.filter((todo) => !todo.done).length;

  return (
    <Card className="w-todo fill">
      <CardHead icon={<ListTodo size={15} />} title="To-do" action={<span className="cal-count">{left} left</span>} />
      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="muted">Nothing yet — add a task below.</p>
        ) : (
          todos.map((todo, index) => (
            <div
              className={`todo${todo.done ? " done" : ""}`}
              key={todo.id}
              onDragOver={(event) => drag.onDragOver(index, event)}
              style={{ opacity: drag.dragging === index ? 0.5 : 1 }}
            >
              <span
                className="drag-handle"
                draggable
                onDragStart={() => drag.onDragStart(index)}
                onDragEnd={drag.onDragEnd}
                aria-label="Drag to reorder"
                role="button"
              >
                <GripVertical size={14} />
              </span>
              <button
                className={`todo-box${todo.done ? " on" : ""}`}
                aria-label={todo.done ? "Mark not done" : "Mark done"}
                onClick={() => commit(todos.map((item) => (item.id === todo.id ? { ...item, done: !item.done } : item)))}
              >
                {todo.done ? <Check size={12} /> : null}
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
                  className="todo-txt flex-1 bg-white/10 px-2 outline-none"
                />
              ) : (
                <span
                  className="todo-txt cursor-pointer"
                  onClick={() => !todo.done && startEdit(todo.id, todo.text)}
                >
                  {todo.text}
                </span>
              )}
              <button className="todo-del" aria-label="Delete" onClick={() => commit(todos.filter((item) => item.id !== todo.id))}>
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
      <form className="add-row glass" onSubmit={add}>
        <input value={draft} placeholder="Add a task…" onChange={(event) => setDraft(event.target.value)} aria-label="New task" />
        <button type="submit" className="add-plus" aria-label="Add task">
          +
        </button>
      </form>
    </Card>
  );
}
