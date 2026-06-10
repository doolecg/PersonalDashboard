import { apiFetch } from "@/app/http";
import {
  getAiStatus,
  getEvents,
  getGoogleEvents,
  getNotes,
  getReminders,
  getTodos,
  saveTodos,
  type CalendarEventDTO,
  type Todo
} from "@/app/apiClient";
import { getAuthState, signOut } from "@/app/auth/authStore";

// The Aura terminal runs *safe dashboard commands only*: every command maps to
// an existing app capability (collections, status endpoints, auth store). It
// never touches an OS shell and never bypasses API auth — every request goes
// through apiFetch with the user's token.

export type TermLine = { text: string; tone?: "ok" | "warn" | "err" | "dim" | "accent" };

export type TermResult = TermLine[];

const line = (text: string, tone?: TermLine["tone"]): TermLine => ({ text, tone });

const time = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) throw new Error(`${path} → ${response.status}`);
  return response.json() as Promise<T>;
}

async function allEvents(): Promise<CalendarEventDTO[]> {
  const [local, google] = await Promise.all([
    getEvents().catch(() => []),
    getGoogleEvents().catch(() => [])
  ]);
  return [...local, ...google]
    .filter((event) => event.start && !Number.isNaN(new Date(event.start).getTime()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

type SyncStatus = { driver: string; lastSyncAt: string | null; lastSyncError: string | null; online: boolean };
type AuthStatus = { email: string; userId: string; mode: string; storageDriver: string; supabaseStorageConfigured: boolean };
type Suggestion = { title: string; message: string; status: string; priority: string };

const HELP: Array<[string, string]> = [
  ["help", "List available commands"],
  ["clear", "Clear terminal output"],
  ["status", "Aura core status summary"],
  ["time / date", "Current time / date"],
  ["calendar today", "Today's events"],
  ["calendar next", "Next upcoming event"],
  ["todos", "List open todos"],
  ["todos due", "Todos plus due reminders"],
  ["todo add <text>", "Add a todo"],
  ["reminders", "List reminders"],
  ["notes", "List notes"],
  ["assistant brief", "Daily brief from AURA Core"],
  ["assistant refresh", "Regenerate suggestions"],
  ["ai status", "AI provider status"],
  ["auth status / auth user", "Session details"],
  ["auth logout", "Sign out"],
  ["storage status", "Storage driver status"],
  ["sync status / sync now", "Sync state / force check"],
  ["supabase status", "Supabase connectivity"],
  ["logs / logs errors", "Recent server logs"],
  ["system info", "Host metrics"],
  ["whoami / uptime / version / ping", "Utilities"]
];

async function cmdStatus(): Promise<TermResult> {
  const auth = getAuthState();
  const [sync, ai] = await Promise.all([
    json<SyncStatus>("/api/sync/status").catch(() => null),
    getAiStatus().catch(() => null)
  ]);
  const aiLabel = ai ? `${ai.mode}${"activeModel" in ai && ai.activeModel ? ` (${String(ai.activeModel)})` : ""}` : "Fallback mode";
  return [
    line("AURA CORE STATUS", "accent"),
    line(`User: ${auth.email || "local"}`),
    line(`Auth: ${auth.phase === "disabled" ? "Disabled (dev)" : "Supabase"}`),
    line(`Storage: ${sync ? sync.driver : "unknown"}`),
    line(`Sync: ${sync ? (sync.online ? "Active" : "Degraded") : "Unknown"}`, sync && !sync.online ? "warn" : undefined),
    line(`AI: ${aiLabel}`),
    line("Assistant: Deterministic suggestions active")
  ];
}

async function cmdAssistantBrief(refresh: boolean): Promise<TermResult> {
  const payload = await json<{ suggestions: Suggestion[] }>(
    refresh ? "/api/assistant/suggestions/refresh" : "/api/assistant/suggestions",
    refresh ? { method: "POST" } : undefined
  );
  const pending = payload.suggestions.filter((item) => item.status === "pending");
  const out: TermResult = [line("DAILY BRIEF", "accent")];
  if (!pending.length) {
    out.push(line("Nothing needs your attention right now.", "dim"));
    return out;
  }
  for (const item of pending) {
    out.push(line(`• ${item.title}${item.priority === "high" ? " [!]" : ""}`, item.priority === "high" ? "warn" : undefined));
    out.push(line(`  ${item.message}`, "dim"));
  }
  return out;
}

export async function runCommand(rawInput: string): Promise<TermResult> {
  const input = rawInput.trim();
  const lower = input.toLowerCase();
  const auth = getAuthState();

  if (!input) return [];

  if (lower === "help") {
    return [line("AURA TERMINAL — safe dashboard commands", "accent"), ...HELP.map(([cmd, desc]) => line(`  ${cmd.padEnd(26)} ${desc}`))];
  }

  if (lower === "status") return cmdStatus();
  if (lower === "time") return [line(new Date().toLocaleTimeString("en-GB"))];
  if (lower === "date") return [line(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))];
  if (lower === "whoami") return [line(auth.email || "local (development)")];
  if (lower === "version") return [line("Aura 0.1.0 — feature/auth-supabase-sci-fi-assistant-redesign")];
  if (lower === "ping") {
    const started = performance.now();
    await apiFetch("/api/healthz");
    return [line(`pong — ${Math.round(performance.now() - started)} ms`, "ok")];
  }
  if (lower === "uptime" || lower === "system info") {
    const status = await json<{ uptime?: number; hostUptime?: number; cpu?: { usage: number; model: string }; memory?: { percent: number }; temp?: number | null }>("/api/system/status");
    if (lower === "uptime") {
      const fmt = (s?: number) => (s ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m` : "—");
      return [line(`Server uptime: ${fmt(status.uptime)}`), line(`Host uptime: ${fmt(status.hostUptime)}`)];
    }
    return [
      line("SYSTEM INFO", "accent"),
      line(`CPU: ${status.cpu ? `${status.cpu.usage}% — ${status.cpu.model}` : "—"}`),
      line(`RAM: ${status.memory ? `${status.memory.percent}%` : "—"}`),
      line(`Temp: ${status.temp != null ? `${status.temp}°C` : "—"}`)
    ];
  }

  if (lower === "calendar today" || lower === "calendar next") {
    const events = await allEvents();
    const now = new Date();
    if (lower === "calendar next") {
      const next = events.find((event) => new Date(event.start) > now);
      return next
        ? [line(`Next: ${next.title} at ${time(next.start)}${next.location ? ` — ${next.location}` : ""}`)]
        : [line("No upcoming events.", "dim")];
    }
    const today = events.filter((event) => new Date(event.start).toDateString() === now.toDateString());
    if (!today.length) return [line("No events today.", "dim")];
    return [line(`${today.length} event(s) today`, "accent"), ...today.map((event) => line(`  ${time(event.start)}  ${event.title}${event.location ? ` — ${event.location}` : ""}`))];
  }

  if (lower === "todos" || lower === "todos due") {
    const todos = await getTodos();
    const open = todos.filter((todo) => !todo.done);
    const out: TermResult = open.length
      ? [line(`${open.length} open todo(s)`, "accent"), ...open.map((todo) => line(`  [ ] ${todo.text}`))]
      : [line("No open todos.", "dim")];
    if (lower === "todos due") {
      const reminders = await getReminders();
      const due = reminders.filter((reminder) => !reminder.done && reminder.due && new Date(reminder.due).getTime() < Date.now() + 24 * 60 * 60 * 1000);
      out.push(...(due.length ? [line(`${due.length} reminder(s) due within 24h`, "warn"), ...due.map((reminder) => line(`  ! ${reminder.text} (${time(reminder.due)})`))] : [line("No reminders due soon.", "dim")]));
    }
    return out;
  }

  if (lower.startsWith("todo add ")) {
    const text = input.slice("todo add ".length).trim();
    if (!text) return [line("Usage: todo add <text>", "warn")];
    const todos = await getTodos();
    await saveTodos([...todos, { id: crypto.randomUUID(), text, done: false, createdAt: new Date().toISOString() } as Todo]);
    return [line(`Added todo: ${text}`, "ok")];
  }

  if (lower === "reminders") {
    const reminders = await getReminders();
    const open = reminders.filter((reminder) => !reminder.done);
    return open.length
      ? [line(`${open.length} reminder(s)`, "accent"), ...open.map((reminder) => line(`  • ${reminder.text}${reminder.due ? ` (${time(reminder.due)})` : ""}`))]
      : [line("No reminders.", "dim")];
  }

  if (lower === "notes") {
    const notes = await getNotes();
    return notes.length
      ? [line(`${notes.length} note(s)`, "accent"), ...notes.map((note) => line(`  • ${note.title || note.text.slice(0, 60)}`))]
      : [line("No notes.", "dim")];
  }

  if (lower === "assistant brief" || lower === "assistant suggest") return cmdAssistantBrief(false);
  if (lower === "assistant refresh") return cmdAssistantBrief(true);

  if (lower === "ai status") {
    const status = await getAiStatus();
    const snapshot = status as unknown as Record<string, unknown>;
    return [
      line("AI STATUS", "accent"),
      line(`Mode: ${String(snapshot.mode ?? "unknown")}`),
      line(`Model: ${String(snapshot.activeModel ?? snapshot.model ?? "auto")}`),
      line("Fallback assistant: Active")
    ];
  }

  if (lower === "auth status" || lower === "auth user") {
    if (auth.phase === "disabled") {
      return [line("AUTH STATUS", "accent"), line("Mode: Disabled (local development)"), line("User: local"), line("Storage: local json")];
    }
    const status = await json<AuthStatus>("/api/auth/status");
    if (lower === "auth user") return [line(`${status.email} (${status.userId})`)];
    return [
      line("AUTH STATUS", "accent"),
      line("Mode: Supabase"),
      line(`User: ${status.email}`),
      line("Access: Authorised", "ok"),
      line("Session: Active", "ok")
    ];
  }

  if (lower === "auth logout") {
    await signOut();
    return [line("Signed out.", "ok")];
  }

  if (lower === "storage status" || lower === "supabase status" || lower === "sync status" || lower === "sync now") {
    const sync =
      lower === "sync now"
        ? await json<SyncStatus>("/api/sync/now", { method: "POST" }).catch(() => null)
        : await json<SyncStatus>("/api/sync/status").catch(() => null);
    if (!sync) return [line("Storage status unavailable.", "err")];
    const head = lower.startsWith("sync") ? "SYNC STATUS" : lower === "supabase status" ? "SUPABASE STATUS" : "STORAGE STATUS";
    return [
      line(head, "accent"),
      line(`Driver: ${sync.driver}`),
      line(`User scoped: ${sync.driver === "supabase" ? "Yes" : "Dev fallback"}`),
      line(`Last sync: ${time(sync.lastSyncAt ?? undefined)}`),
      line(`Status: ${sync.online ? "Online" : "Degraded"}`, sync.online ? "ok" : "warn"),
      ...(sync.lastSyncError ? [line(`Last error: ${sync.lastSyncError}`, "warn")] : [])
    ];
  }

  if (lower === "theme status") {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return [line("THEME STATUS", "accent"), line("Skin: Retro sci-fi (phosphor)"), line(`Reduced motion: ${reduced ? "On" : "Off"}`)];
  }

  if (lower === "logs" || lower === "logs errors") {
    const payload = await json<{ logs: Array<{ time: string; level: string; message: string; count?: number }> }>("/api/log/recent");
    const logs = lower === "logs errors" ? payload.logs.filter((entry) => entry.level === "error") : payload.logs;
    const tail = logs.slice(-12);
    if (!tail.length) return [line("No log entries.", "dim")];
    return tail.map((entry) =>
      line(
        `${time(entry.time)} [${entry.level.toUpperCase()}] ${entry.message}${entry.count && entry.count > 1 ? ` (×${entry.count})` : ""}`,
        entry.level === "error" ? "err" : entry.level === "warn" ? "warn" : "dim"
      )
    );
  }

  return [line(`Unknown command: ${input}`, "warn"), line("Type 'help' to list available commands.", "dim")];
}
