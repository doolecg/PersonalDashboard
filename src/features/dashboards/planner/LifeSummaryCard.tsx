import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { getLifeSummary, type LifeSummaryEvent } from "@/app/apiClient";
import { getUpcomingEvents } from "@/features/cards/calendar/calendarUtils";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import { Card } from "./ui";
import { usePlannerEvents } from "./usePlannerEvents";

export function LifeSummaryCard() {
  const events = usePlannerEvents();
  const { data: weather } = useWeatherData();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const payload = useMemo<{ events: LifeSummaryEvent[]; weather?: string }>(() => {
    const upcoming = getUpcomingEvents(events, new Date(), 8).map((event) => ({
      title: event.title,
      start: event.start,
      end: event.end,
      location: event.location,
      category: event.category
    }));
    const weatherBrief = weather ? `${weather.current.conditionLabel}, ${Math.round(weather.current.temperatureC)}°` : undefined;
    return { events: upcoming, weather: weatherBrief };
  }, [events, weather]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLifeSummary(payload.events, payload.weather)
      .then((result) => !cancelled && setSummary(result.summary))
      .catch(() => !cancelled && setSummary("Couldn't build your summary right now."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [payload, nonce]);

  const lines = (summary ?? "").split("\n").map((line) => line.trim()).filter(Boolean);

  return (
    <Card className="w-ai fill">
      <div className="ai-head">
        <span className="ai-orb">
          <Sparkles size={16} />
        </span>
        <span className="ai-title">Life summary</span>
        <button className="icon-btn" style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }} aria-label="Refresh summary" onClick={() => setNonce((value) => value + 1)}>
          <RefreshCw size={14} />
        </button>
      </div>
      {loading && !summary ? (
        <p className="muted">Reading your day…</p>
      ) : (
        <ul className="ai-list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
          {lines.map((line, index) => (
            <li key={index} style={{ position: "relative", paddingLeft: 20, fontSize: 14.5, lineHeight: 1.45, color: "rgba(255,255,255,0.9)" }}>
              <span style={{ position: "absolute", left: 2, top: 7, width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} />
              {line}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
