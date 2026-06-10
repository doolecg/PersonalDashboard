import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/app/http";
import { getAiStatus } from "@/app/apiClient";
import { signOut } from "@/app/auth/authStore";
import { useAuth } from "@/app/auth/useAuth";
import "./system.css";

type SyncStatus = { driver: string; lastSyncAt: string | null; lastSyncError: string | null; online: boolean };

type Led = "green" | "amber" | "red" | "dim";

function Row({ label, value, led }: { label: string; value: string; led?: Led }) {
  return (
    <div className="syss-row">
      <span className="syss-label">{label}</span>
      <span className="syss-value">
        {led ? <span className={`aura-led aura-led-${led}`} aria-hidden /> : null}
        {value}
      </span>
    </div>
  );
}

// AUTH / STORAGE / SYNC / AI status — the calm "machine room" overview.
export function SystemStatusPanel() {
  const auth = useAuth();
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [aiLabel, setAiLabel] = useState("Checking…");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await apiFetch("/api/sync/status");
      if (response.ok) setSync((await response.json()) as SyncStatus);
    } catch {
      setSync(null);
    }
    try {
      const status = (await getAiStatus()) as unknown as Record<string, unknown>;
      setAiLabel(String(status.mode ?? "unknown"));
    } catch {
      setAiLabel("Not configured");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await apiFetch("/api/sync/now", { method: "POST" });
      setSync((await response.json()) as SyncStatus);
    } catch {
      // keep previous state; row already shows degraded
    } finally {
      setSyncing(false);
    }
  }, []);

  const devMode = auth.phase === "disabled";

  return (
    <div className="syss">
      <div className="sys-tag">AUTH STATUS</div>
      <Row label="Mode" value={devMode ? "Disabled (dev)" : "Supabase"} led={devMode ? "amber" : "green"} />
      <Row label="User" value={devMode ? "local" : auth.email || "—"} />
      <Row label="Access" value={devMode ? "Open (local only)" : "Authorised"} led={devMode ? "amber" : "green"} />
      <Row label="Session" value={devMode ? "n/a" : "Active"} />

      <div className="sys-tag syss-gap">STORAGE / SYNC</div>
      <Row
        label="Storage"
        value={sync ? sync.driver : "—"}
        led={sync ? (sync.driver === "supabase" ? "green" : "amber") : "dim"}
      />
      <Row
        label="Sync"
        value={sync ? (sync.online ? "Active" : "Degraded") : "Unknown"}
        led={sync ? (sync.online ? "green" : "amber") : "dim"}
      />
      <Row
        label="Last sync"
        value={
          sync?.lastSyncAt
            ? new Date(sync.lastSyncAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "—"
        }
      />
      {sync?.lastSyncError ? <p className="syss-note">{sync.lastSyncError}</p> : null}

      <div className="sys-tag syss-gap">AI</div>
      <Row label="Provider" value={aiLabel} led={aiLabel === "Not configured" ? "dim" : "green"} />
      {aiLabel === "Not configured" ? (
        <p className="syss-note">Deterministic assistant remains active without a provider.</p>
      ) : null}

      <div className="syss-actions">
        <button type="button" className="aura-btn" onClick={() => void syncNow()} disabled={syncing}>
          {syncing ? "Checking…" : "Sync now"}
        </button>
        {!devMode ? (
          <button type="button" className="aura-btn" onClick={() => void signOut()}>
            Sign out
          </button>
        ) : null}
      </div>
    </div>
  );
}
