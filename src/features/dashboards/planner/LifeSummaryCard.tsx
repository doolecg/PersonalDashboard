import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { getLifeSummary, getTldr, getReminders, getTodos, type LifeSummaryEvent, type TldrTopic } from "@/app/apiClient";
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

export function LifeSummaryCard() {
  const events = usePlannerEvents();
  const { data: weather } = useWeatherData();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataNonce, setDataNonce] = useState(0);
  const [tasks, setTasks] = useState<string[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);

  const [tldr, setTldr] = useState<TldrTopic[] | null>(null);
  const [tldrNonce, setTldrNonce] = useState(0);
  const [refreshSpinKey, setRefreshSpinKey] = useState(0);

  useEffect(() => {
    const unsubs = [
      on("todos-changed", () => setDataNonce((v) => v + 1)),
      on("notes-changed", () => setDataNonce((v) => v + 1)),
      on("events-changed", () => setDataNonce((v) => v + 1)),
      on("refresh-summary", () => setDataNonce((v) => v + 1)),
      on("refresh-news", () => setTldrNonce((v) => v + 1))
    ];
    return () => unsubs.forEach((fn) => fn());
  }, []);

  // Tasks + reminders for the "Your day" brief.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getTodos(), getReminders()])
      .then(([nextTodos, nextReminders]) => {
        if (cancelled) return;
        setTasks(nextTodos.filter((todo) => !todo.done).map((todo) => todo.text));
        setReminders(
          nextReminders
            .filter((reminder) => !reminder.done)
            .map((reminder) => (reminder.due ? `${reminder.text} — due ${reminder.due}` : reminder.text))
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [dataNonce]);

  // TLDR topic briefs (AI / Dev / Design / IT).
  // tldrNonce > 0 means the user hit Refresh — bypass the server cache on those fetches.
  useEffect(() => {
    let cancelled = false;
    getTldr(tldrNonce > 0)
      .then((result) => !cancelled && setTldr(result.topics))
      .catch(() => !cancelled && setTldr([]));
    return () => {
      cancelled = true;
    };
  }, [tldrNonce]);

  const payload = useMemo<SummaryPayload>(() => {
    const upcoming = getUpcomingEvents(events, new Date(), 8).map((event) => ({
      title: event.title,
      start: event.start,
      end: event.end,
      location: event.location,
      category: event.category
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, dataNonce]);

  const dayText = stripMarkdown(summary ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Card className="w-ai fill">
      <div className="ai-head">
        <span className="ai-orb">
          <Sparkles size={16} />
        </span>
        <span className="ai-title">Life summary</span>
        <button
          className="icon-btn"
          style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }}
          aria-label="Refresh"
          onClick={() => {
            setDataNonce((value) => value + 1);
            setTldrNonce((value) => value + 1);
            setRefreshSpinKey((value) => value + 1);
          }}
        >
          <RefreshCw size={14} key={refreshSpinKey} className="spinning" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", minHeight: 0 }}>
        <div>
          <div className="weather-section-label">Your day</div>
          {loading && !summary ? (
            <AiSkeleton widths={[100, 92, 70]} />
          ) : (
            dayText.map((paragraph, index) => (
              <p key={index} style={{ margin: "2px 0 0", fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>
                {paragraph}
              </p>
            ))
          )}
        </div>

        <div>
          <div className="weather-section-label">TLDR</div>
          {tldr === null ? (
            <AiSkeleton widths={[90, 96, 84, 92]} />
          ) : (
            <div className="tldr-list">
              {tldr.map((topic) => (
                <div className="tldr-topic" key={topic.label}>
                  <div className="tldr-row">
                    <span className="tldr-tag">{topic.label}</span>
                    <span className="tldr-text">{stripMarkdown(topic.tldr)}</span>
                  </div>
                  {topic.headlines && topic.headlines.length > 0 && (
                    <div className="tldr-headlines">
                      {topic.headlines.map((h, i) => (
                        <a
                          key={i}
                          className="tldr-headline"
                          href={h.url || undefined}
                          target={h.url ? "_blank" : undefined}
                          rel="noreferrer"
                        >
                          {h.image ? (
                            <span className="tldr-thumb" style={{ backgroundImage: `url(${h.image})` }} aria-hidden />
                          ) : (
                            <span className="tldr-thumb tldr-thumb-empty" aria-hidden />
                          )}
                          <span className="tldr-hl-text">
                            <span className="tldr-hl-title">{h.title}</span>
                            {h.description ? (
                              <span className="tldr-hl-desc">{h.description}</span>
                            ) : (
                              <span className="tldr-hl-src">{h.source}</span>
                            )}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
