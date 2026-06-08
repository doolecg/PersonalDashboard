import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, RefreshCw, Send, Sparkles, X } from "lucide-react";
import { getChatMessages, setChatMessages } from "./chatStore";
import {
  getNotes,
  getReminders,
  getTodos,
  sendAssistantMessage,
  type AssistantChatMessage,
  type Note,
  type Reminder,
  type Todo
} from "@/app/apiClient";
import { usePreferences } from "@/app/preferences/usePreferences";
import { getUpcomingEvents } from "@/features/cards/calendar/calendarUtils";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { AiSkeleton } from "./AiSkeleton";
import { Card } from "./ui";
import { usePlannerEvents } from "./usePlannerEvents";
import { emit, on } from "./plannerEvents";

const suggestions = [
  "What's the weather looking like today?",
  "Summarise what's on my plate.",
  "What should I wear for the evening?"
];

type AiChatCardProps = {
  // "inline" sits in the desktop column; "floating" is the phone live-chat
  // button that opens a slide-up panel.
  variant?: "inline" | "floating";
};

export function AiChatCard({ variant = "inline" }: AiChatCardProps) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => getChatMessages());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [contextNonce, setContextNonce] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const preferences = usePreferences();
  const { data: weather } = useWeatherData();
  const events = usePlannerEvents();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Subscribe to refresh-chatbox event.
  useEffect(() => {
    const unsub = on("refresh-chatbox", () => setContextNonce((v) => v + 1));
    return unsub;
  }, []);

  // Pull in the rest of the dashboard so Aura can answer about the user's whole
  // day (tasks, reminders, notes, upcoming events) — not just the weather.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getTodos(), getReminders(), getNotes()])
      .then(([nextTodos, nextReminders, nextNotes]) => {
        if (cancelled) return;
        setTodos(nextTodos);
        setReminders(nextReminders);
        setNotes(nextNotes);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [contextNonce]);

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Give the assistant the user's location, conditions, and the rest of the
  // dashboard so it can answer questions without needing a tool call.
  function buildContext(): Record<string, unknown> {
    const location = preferences.location
      ? { name: preferences.location.name, latitude: preferences.location.latitude, longitude: preferences.location.longitude }
      : weather
        ? { name: weather.current.location, latitude: weather.current.latitude, longitude: weather.current.longitude }
        : undefined;

    const upcoming = getUpcomingEvents(events, new Date(), 8).map((event) => ({
      title: event.title,
      start: event.start,
      location: event.location
    }));

    return {
      location,
      weather: weather
        ? {
            temperatureC: Math.round(weather.current.temperatureC),
            feelsLikeC: typeof weather.current.feelsLikeC === "number" ? Math.round(weather.current.feelsLikeC) : undefined,
            condition: weather.current.conditionLabel,
            highC: weather.current.highC,
            lowC: weather.current.lowC
          }
        : undefined,
      calendar: upcoming,
      tasks: todos.filter((todo) => !todo.done).map((todo) => todo.text),
      reminders: reminders
        .filter((reminder) => !reminder.done)
        .map((reminder) => (reminder.due ? `${reminder.text} — due ${reminder.due}` : reminder.text)),
      notes: notes.map((note) => (note.title ? `${note.title}: ${note.text}` : note.text)),
      localTime: new Date().toLocaleString()
    };
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: AssistantChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const result = await sendAssistantMessage(next, buildContext());
      setMessages([...next, { role: "assistant", content: result.reply }]);
      for (const tool of result.toolCalls) {
        if (tool.name === "manage_todos") emit("todos-changed");
        else if (tool.name === "manage_notes") emit("notes-changed");
        else if (tool.name === "manage_calendar") emit("events-changed");
        else if (tool.name === "manage_reminders") emit("reminders-changed");
      }
    } catch (error) {
      setMessages([...next, { role: "assistant", content: error instanceof Error ? error.message : "Sorry, I couldn't reach the assistant." }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  const chatBody = (
    <>
      <div className="ai-head">
        <span className="ai-orb">
          <Sparkles size={16} />
        </span>
        <span className="ai-title">Ask Aura</span>
        {variant === "floating" ? (
          <button type="button" className="ai-badge ai-close" onClick={() => setOpen(false)} aria-label="Close chat">
            <X size={14} />
          </button>
        ) : (
          <>
            <span className="ai-badge">AI</span>
            <button className="icon-btn" style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }} aria-label="Refresh context" onClick={() => setContextNonce((value) => value + 1)}>
              <RefreshCw size={14} />
            </button>
          </>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="chat-empty">
          <ul className="ai-list">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => void send(suggestion)}
                  style={{ background: "none", border: "none", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer", padding: 0 }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="chat-scroll" ref={scrollRef}>
          {messages.map((message, index) => (
            <div className={`chat-msg ${message.role}`} key={index}>
              {message.role === "assistant" ? stripMarkdown(message.content) : message.content}
            </div>
          ))}
          {busy ? (
            <div className="chat-msg assistant" style={{ minWidth: 140 }}>
              <AiSkeleton widths={[80, 55]} />
            </div>
          ) : null}
        </div>
      )}

      <form className="ai-ask glass" onSubmit={handleSubmit}>
        <Sparkles size={15} style={{ opacity: 0.6, flex: "none" }} />
        <input
          value={draft}
          placeholder="Ask Aura anything…"
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Message Aura"
        />
        <button type="submit" className="ai-send" disabled={busy || !draft.trim()} aria-label="Send">
          <Send size={15} />
        </button>
      </form>
    </>
  );

  if (variant === "floating") {
    return (
      <>
        <button
          type="button"
          className="ai-fab"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close Aura chat" : "Chat with Aura"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
        <Card className={`w-ai ai-panel${open ? " open" : ""}`}>{chatBody}</Card>
      </>
    );
  }

  return <Card className="w-ai fill">{chatBody}</Card>;
}
