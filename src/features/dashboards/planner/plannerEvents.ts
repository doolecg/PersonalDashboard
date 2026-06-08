type EventName = "todos-changed" | "notes-changed" | "events-changed" | "reminders-changed" | "refresh-summary" | "refresh-news" | "refresh-chatbox";
type Listener = () => void;

const listeners = new Map<EventName, Set<Listener>>();

export function on(name: EventName, fn: Listener): () => void {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(fn);
  return () => {
    listeners.get(name)?.delete(fn);
  };
}

export function emit(name: EventName): void {
  listeners.get(name)?.forEach((fn) => fn());
}
