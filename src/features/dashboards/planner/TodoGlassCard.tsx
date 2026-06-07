import { useEffect, useState, type FormEvent } from "react";
import { Check, ListTodo, X } from "lucide-react";
import { getTodos, saveTodos, type Todo } from "@/app/apiClient";
import { Card, CardHead } from "./ui";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TodoGlassCard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTodos()
      .then((items) => !cancelled && setTodos(items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function commit(next: Todo[]) {
    setTodos(next);
    saveTodos(next).catch(() => undefined);
  }

  function add(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    commit([...todos, { id: newId(), text, done: false, createdAt: new Date().toISOString() }]);
    setDraft("");
  }

  const left = todos.filter((todo) => !todo.done).length;

  return (
    <Card className="w-todo fill">
      <CardHead icon={<ListTodo size={15} />} title="To-do" action={<span className="cal-count">{left} left</span>} />
      <div className="todo-list">
        {todos.length === 0 ? (
          <p className="muted">Nothing yet — add a task below.</p>
        ) : (
          todos.map((todo) => (
            <div className={`todo${todo.done ? " done" : ""}`} key={todo.id}>
              <button
                className={`todo-box${todo.done ? " on" : ""}`}
                aria-label={todo.done ? "Mark not done" : "Mark done"}
                onClick={() => commit(todos.map((item) => (item.id === todo.id ? { ...item, done: !item.done } : item)))}
              >
                {todo.done ? <Check size={12} /> : null}
              </button>
              <span className="todo-txt">{todo.text}</span>
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
