import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "@/app/http";
import "../system/system.css";

type Action = {
  label: string;
  action: "create_todo" | "create_reminder" | "create_note" | "open_calendar" | "dismiss";
  requiresApproval: boolean;
  payload?: Record<string, unknown>;
};

type Suggestion = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "accepted" | "dismissed" | "completed";
  actions: Action[];
};

// AURA Core — proactive suggestions. Deterministic server-side engine; every
// write action (todo/reminder/note) needs an explicit click here, and
// dismissals are stored per user so they hold across devices.
export function AssistantSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      const response = await apiFetch(
        refresh ? "/api/assistant/suggestions/refresh" : "/api/assistant/suggestions",
        refresh ? { method: "POST" } : undefined
      );
      if (response.ok) {
        const payload = (await response.json()) as { suggestions?: Suggestion[] };
        setSuggestions(payload.suggestions ?? []);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const execute = useCallback(
    async (suggestion: Suggestion, action: Action) => {
      setBusyId(suggestion.id);
      try {
        if (action.action === "dismiss") {
          await apiFetch(`/api/assistant/suggestions/${suggestion.id}/dismiss`, { method: "POST" });
        } else {
          await apiFetch("/api/assistant/actions/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ suggestionId: suggestion.id, action: action.action, payload: action.payload })
          });
        }
        await load();
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  const pending = (suggestions ?? []).filter((item) => item.status === "pending");

  return (
    <div className="acore">
      <div className="acore-head">
        <span className="sys-tag">AURA.CORE</span>
        <button type="button" className="sysl-chip" onClick={() => void load(true)} aria-label="Refresh suggestions">
          <RefreshCw size={11} />
        </button>
      </div>
      {suggestions === null ? <p className="muted">Reading your day…</p> : null}
      {suggestions !== null && !pending.length ? (
        <p className="muted">Nothing needs your attention right now.</p>
      ) : null}
      {pending.map((suggestion) => (
        <div key={suggestion.id} className={`acore-card acore-${suggestion.priority}`}>
          <div className="acore-title">
            {suggestion.priority !== "low" ? (
              <span className={`aura-led aura-led-${suggestion.priority === "high" ? "red" : "amber"}`} aria-hidden />
            ) : null}
            {suggestion.title}
          </div>
          <p className="acore-msg">{suggestion.message}</p>
          <div className="acore-actions">
            {suggestion.actions
              .filter((action) => action.action !== "open_calendar")
              .map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`aura-btn${action.action !== "dismiss" ? " aura-btn-primary" : ""}`}
                  disabled={busyId === suggestion.id}
                  onClick={() => void execute(suggestion, action)}
                >
                  {action.label}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
