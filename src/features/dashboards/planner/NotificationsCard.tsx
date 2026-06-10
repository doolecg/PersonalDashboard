import { apiFetch } from "@/app/http";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Bell, Info, RefreshCw } from "lucide-react";
import { Card } from "./ui";

type LogEntry = { time: string; level: "info" | "warn" | "error"; message: string };

async function fetchLogs(): Promise<LogEntry[]> {
  const res = await apiFetch("/api/log/recent");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { logs: LogEntry[] };
  return data.logs;
}

const levelIcon = {
  info: <Info size={11} />,
  warn: <AlertTriangle size={11} />,
  error: <AlertCircle size={11} />,
};

export function NotificationsCard() {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function load() {
    fetchLogs()
      .then((entries) => setLogs(entries.slice().reverse()))
      .catch(() => setLogs([]));
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <Card className="fill">
      <div className="ai-head">
        <span className="card-icon"><Bell size={14} /></span>
        <span className="ai-title">Server Log</span>
        <button
          className="icon-btn"
          style={{ width: 28, height: 28, background: "rgba(255,255,255,0.1)" }}
          aria-label="Refresh logs"
          onClick={() => { setSpinKey((k) => k + 1); load(); }}
        >
          <RefreshCw size={14} key={spinKey} className="spinning" />
        </button>
      </div>

      <div style={{ overflowY: "auto", minHeight: 0, flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {logs === null ? (
          <p className="muted">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="muted">No recent log entries.</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`log-entry log-${log.level}`}>
              <span className="log-icon">{levelIcon[log.level]}</span>
              <span className="log-msg">{log.message}</span>
              <span className="log-time">{new Date(log.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
