import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { getLifeSummary, getReminders, getTodos, type LifeSummaryEvent } from "@/app/apiClient";
import { getUpcomingEvents } from "@/features/cards/calendar/calendarUtils";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import { buildWeatherAdvice } from "@/features/cards/weather/weatherAdvice";
import { stripMarkdown } from "@/lib/stripMarkdown";
import { AiSkeleton } from "./AiSkeleton";
import { Card } from "./ui";
import { usePlannerEvents } from "./usePlannerEvents";
import { on } from "./plannerEvents";

type SummaryPayload = {
  events: LifeSummaryEvent[];
  weather?: string;
  tasks: string[];
  reminders: string[];
  advice?: string;
};

type Props = {
  compact?: boolean;
};

export function LifeSummaryCard({ compact }: Props) {
  const events = usePlannerEvents();
  const { data: weather } = useWeatherData();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataNonce, setDataNonce] = useState(0);
  // Separate nonce for forcing a summary re-run without changing underlying data.
  const [summaryNonce, setSummaryNonce] = useState(0);
  const [tasks, setTasks] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [refreshSpinKey, setRefreshSpinKey] = useState(0);

  useEffect(() => {
    const unsubs = [
      on("todos-changed", () => setDataNonce((v) => v + 1)),
      on("notes-changed", () => setDataNonce((v) => v + 1)),
      on("events-changed", () => setDataNonce((v) => v + 1)),
      on("refresh-summary", () => setSummaryNonce((v) => v + 1))
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTodos(), getReminders()])
      .then(([nextTodos, nextReminders]) => {
        if (cancelled) return;
        setTasks(nextTodos.filter((t) => !t.done).map((t) => t.text));
        setReminders(
          nextReminders
            .filter((r) => !r.done)
            .map((r) => (r.due ? `${r.text} — due ${r.due}` : r.text))
        );
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [dataNonce]);

  const payload = useMemo<SummaryPayload>(() => {
    const upcoming = getUpcomingEvents(events, new Date(), 8).map((e) => ({
      title: e.title, start: e.start, end: e.end, location: e.location, category: e.category
    }));
    const weatherBrief = weather ? `${weather.current.conditionLabel}, ${Math.round(weather.current.temperatureC)}°` : undefined;
    const advice = weather ? buildWeatherAdvice(weather) : undefined;
    return { events: upcoming, weather: weatherBrief, tasks, reminders, advice };
  }, [events, weather, tasks, reminders]);

  const signature = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLifeSummary(payload.events, payload.weather, payload.tasks, payload.reminders, [], payload.advice)
      .then((result) => !cancelled && setSummary(result.summary))
      .catch(() => !cancelled && setSummary("Couldn't build your summary right now."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [signature, summaryNonce]);

  const dayText = stripMarkdown(summary ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <Card className={compact ? undefined : "w-ai fill"} style={compact ? { flex: "1 1 0", minHeight: 0 } : undefined}>
      <div className="ai-head">
        <span className="ai-orb"><Sparkles size={16} /></span>
        <span className="ai-title">Your day</span>
        <button
          className="icon-btn"
          style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }}
          aria-label="Refresh"
          onClick={() => { setDataNonce((v) => v + 1); setSummaryNonce((v) => v + 1); setRefreshSpinKey((v) => v + 1); }}
        >
          <RefreshCw size={14} key={refreshSpinKey} className="spinning" />
        </button>
      </div>

      <div style={{ overflowY: "auto", minHeight: 0, flex: 1 }}>
        {loading && !summary ? (
          <AiSkeleton widths={[100, 92, 70]} />
        ) : (
          dayText.map((paragraph, i) => (
            <p key={i} style={{ margin: "2px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>
              {paragraph}
            </p>
          ))
        )}
      </div>
    </Card>
  );
}
