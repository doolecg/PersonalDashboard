import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "@/app/http";
import "./system.css";

type LogEntry = { time: string; level: "info" | "warn" | "error"; message: string; source?: string; count?: number };

type Filter = "all" | "info" | "warn" | "error";

// Dedupe consecutive identical messages client-side as a second layer on top
// of the server-side throttle: "repeated N times" instead of a wall of spam.
function dedupe(logs: LogEntry[]): LogEntry[] {
  const out: LogEntry[] = [];
  for (const entry of logs) {
    const last = out[out.length - 1];
    if (last && last.message === entry.message && last.level === entry.level) {
      last.count = (last.count ?? 1) + (entry.count ?? 1);
      last.time = entry.time;
    } else {
      out.push({ ...entry });
    }
  }
  return out;
}

export function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/log/recent");
      if (response.ok) {
        const payload = (await response.json()) as { logs?: LogEntry[] };
        setLogs(dedupe(payload.logs ?? []));
      }
    } catch {
      // The diagnostics panel must never throw — show what we have.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? logs : logs.filter((entry) => entry.level === filter)).slice(-60).reverse(),
    [logs, filter]
  );

  return (
    <div className="sysl">
      <div className="sysl-bar">
        {(["all", "info", "warn", "error"] as const).map((level) => (
          <button
            key={level}
            type="button"
            className={`sysl-chip${filter === level ? " active" : ""}`}
            aria-pressed={filter === level}
            onClick={() => setFilter(level)}
          >
            {level.toUpperCase()}
          </button>
        ))}
        <button type="button" className="sysl-chip" onClick={() => void load()} aria-label="Refresh logs">
          <RefreshCw size={11} />
        </button>
      </div>
      <div className="sysl-list" role="log">
        {loading && !logs.length ? <p className="muted">Reading diagnostics…</p> : null}
        {!loading && !visible.length ? <p className="muted">No {filter === "all" ? "" : `${filter} `}entries.</p> : null}
        {visible.map((entry, index) => (
          <div key={`${entry.time}-${index}`} className={`sysl-row sysl-${entry.level}`}>
            <span className="sysl-time">
              {new Date(entry.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="sysl-level">{entry.level.toUpperCase()}</span>
            <span className="sysl-msg">
              {entry.message}
              {entry.count && entry.count > 1 ? <span className="sysl-count"> repeated {entry.count} times</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
