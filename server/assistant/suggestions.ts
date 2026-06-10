import { createHash } from "node:crypto";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { getStorageDriver, withSyncTracking } from "../storage/driver.js";
import { listGoogleEvents } from "../google/calendar.js";
import { isConnected as isGoogleConnected } from "../google/oauth.js";

// Deterministic proactive-assistant engine. Suggestions are derived from the
// user's synced data (events, todos, reminders) with plain TypeScript rules —
// no AI required — so the panel keeps working when no provider is configured.
// Because inputs are synced per user, every device derives the same
// suggestions; only the dismissed/accepted state needs to be stored (also
// synced via the storage driver).

export type AssistantActionKind =
  | "create_todo"
  | "create_reminder"
  | "create_note"
  | "open_calendar"
  | "dismiss";

export type AssistantAction = {
  label: string;
  action: AssistantActionKind;
  requiresApproval: boolean;
  payload?: Record<string, unknown>;
};

export type AssistantSuggestionType =
  | "daily_brief"
  | "todo_suggestion"
  | "restaurant_suggestion"
  | "travel_warning"
  | "calendar_gap"
  | "reminder_suggestion"
  | "system_notice"
  | "auth_notice"
  | "sync_notice";

export type AssistantSuggestion = {
  id: string;
  userId: string;
  type: AssistantSuggestionType;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "accepted" | "dismissed" | "completed";
  createdAt: string;
  updatedAt?: string;
  context?: Record<string, unknown>;
  actions: AssistantAction[];
};

type Todo = { id: string; text: string; done: boolean; createdAt: string };
type Reminder = { id: string; text: string; due?: string; done: boolean };
type CalendarEvent = { id: string; title: string; start: string; end?: string; location?: string };

type AssistantState = {
  dismissed: Record<string, string>; // suggestion id -> ISO date dismissed
  accepted: Record<string, string>;
};

const STATE_COLLECTION = "assistant";
const STATE_KEY = "state";
const STATE_RETENTION_DAYS = 14;

async function loadState(userId: string): Promise<AssistantState> {
  const state = await withSyncTracking(() =>
    getStorageDriver().getObject<AssistantState>(userId, STATE_COLLECTION, STATE_KEY)
  );
  return { dismissed: state?.dismissed ?? {}, accepted: state?.accepted ?? {} };
}

async function saveState(userId: string, state: AssistantState): Promise<void> {
  const cutoff = Date.now() - STATE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const prune = (record: Record<string, string>) =>
    Object.fromEntries(Object.entries(record).filter(([, when]) => new Date(when).getTime() > cutoff));
  await withSyncTracking(() =>
    getStorageDriver().setObject(userId, STATE_COLLECTION, STATE_KEY, {
      dismissed: prune(state.dismissed),
      accepted: prune(state.accepted)
    })
  );
}

// Stable id per (type, subject, day) so a dismissal holds across regeneration
// and across devices.
function suggestionId(type: string, subject: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha1").update(`${type}|${subject}|${day}`).digest("hex").slice(0, 16);
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function isSameLocalDay(iso: string, ref = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
}

async function loadEvents(userId: string): Promise<CalendarEvent[]> {
  const local = await withSyncTracking(() => getStorageDriver().list<CalendarEvent>(userId, "events"));
  let google: CalendarEvent[] = [];
  try {
    if (await isGoogleConnected()) {
      google = (await listGoogleEvents()) as CalendarEvent[];
    }
  } catch (error) {
    logger.dedupedWarn("assistant:google-events", "Assistant could not read Google events", {
      message: error instanceof Error ? error.message : String(error)
    });
  }
  return [...local, ...google]
    .filter((event) => event.start && !Number.isNaN(new Date(event.start).getTime()))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function hasAiProvider(): boolean {
  return Boolean(env.openRouterApiKey || env.openAiApiKey || env.geminiApiKey);
}

const PREP_KEYWORDS = /\b(meeting|review|interview|presentation|appointment|demo|call|1:1|standup)\b/i;
const MIN_GAP_MINUTES = 45;
const BACK_TO_BACK_MINUTES = 10;

export async function generateSuggestions(userId: string): Promise<AssistantSuggestion[]> {
  const now = new Date();
  const [todos, reminders, events, state] = await Promise.all([
    withSyncTracking(() => getStorageDriver().list<Todo>(userId, "todos")),
    withSyncTracking(() => getStorageDriver().list<Reminder>(userId, "reminders")),
    loadEvents(userId),
    loadState(userId)
  ]);

  const suggestions: AssistantSuggestion[] = [];
  const createdAt = now.toISOString();

  const add = (
    type: AssistantSuggestionType,
    subject: string,
    title: string,
    message: string,
    priority: AssistantSuggestion["priority"],
    actions: AssistantAction[],
    context?: Record<string, unknown>
  ) => {
    const id = suggestionId(type, subject);
    const status: AssistantSuggestion["status"] = state.dismissed[id]
      ? "dismissed"
      : state.accepted[id]
        ? "accepted"
        : "pending";
    suggestions.push({ id, userId, type, title, message, priority, status, createdAt, context, actions });
  };

  const todayEvents = events.filter((event) => isSameLocalDay(event.start, now));
  const openTodos = todos.filter((todo) => !todo.done);
  const dueReminders = reminders.filter(
    (reminder) => !reminder.done && reminder.due && new Date(reminder.due).getTime() < now.getTime() + 24 * 60 * 60 * 1000
  );

  // Daily brief — always present, low priority, no approval needed.
  const briefParts = [
    `${todayEvents.length} event${todayEvents.length === 1 ? "" : "s"} today`,
    `${openTodos.length} open todo${openTodos.length === 1 ? "" : "s"}`,
    `${dueReminders.length} reminder${dueReminders.length === 1 ? "" : "s"} due soon`
  ];
  const nextEvent = todayEvents.find((event) => new Date(event.start) > now);
  add(
    "daily_brief",
    "brief",
    "Daily brief",
    `${briefParts.join(", ")}.${nextEvent ? ` Next: ${nextEvent.title} at ${fmtTime(nextEvent.start)}.` : ""}`,
    "low",
    [{ label: "Open calendar", action: "open_calendar", requiresApproval: false }]
  );

  // Calendar gaps between today's remaining events (lunch/free windows).
  const upcoming = todayEvents.filter((event) => new Date(event.start) > now);
  for (let i = 0; i < upcoming.length; i += 1) {
    const previous = i === 0 ? null : upcoming[i - 1];
    const previousEnd = previous ? new Date(previous.end ?? previous.start) : now;
    const start = new Date(upcoming[i].start);
    const gapMinutes = Math.round((start.getTime() - previousEnd.getTime()) / 60000);
    if (gapMinutes >= MIN_GAP_MINUTES) {
      const where = upcoming[i].location ? ` before your event in ${upcoming[i].location}` : "";
      const lunchWindow = start.getHours() >= 11 && previousEnd.getHours() <= 15;
      const restaurantLine = lunchWindow
        ? env.googleMapsApiKey
          ? " Restaurant suggestions are available."
          : " Restaurant search can be enabled by adding a Google Maps API key."
        : "";
      add(
        "calendar_gap",
        `gap-${upcoming[i].id}`,
        "Free window detected",
        `You have ${gapMinutes} minutes free${where} (${upcoming[i].title} at ${fmtTime(upcoming[i].start)}).${restaurantLine}`,
        "low",
        [
          {
            label: "Add reminder",
            action: "create_reminder",
            requiresApproval: true,
            payload: { text: `Free window before ${upcoming[i].title}`, due: upcoming[i].start }
          },
          { label: "Dismiss", action: "dismiss", requiresApproval: false }
        ]
      );
      break; // one gap suggestion per day is enough
    }
  }

  // Back-to-back events: warn when there is no travel/breathing room.
  for (let i = 1; i < todayEvents.length; i += 1) {
    const previous = todayEvents[i - 1];
    const current = todayEvents[i];
    if (new Date(current.start) < now) continue;
    const previousEnd = new Date(previous.end ?? previous.start);
    const gapMinutes = Math.round((new Date(current.start).getTime() - previousEnd.getTime()) / 60000);
    if (gapMinutes >= 0 && gapMinutes < BACK_TO_BACK_MINUTES) {
      const travel = previous.location && current.location && previous.location !== current.location;
      add(
        "travel_warning",
        `b2b-${current.id}`,
        travel ? "Tight transition between locations" : "Back-to-back events",
        `${previous.title} runs into ${current.title} at ${fmtTime(current.start)} with only ${gapMinutes} minutes between${travel ? ` — and they are in different locations (${previous.location} → ${current.location})` : ""}.`,
        "medium",
        [
          {
            label: "Add reminder",
            action: "create_reminder",
            requiresApproval: true,
            payload: { text: `Leave for ${current.title}`, due: previous.end ?? previous.start }
          },
          { label: "Dismiss", action: "dismiss", requiresApproval: false }
        ]
      );
      break;
    }
  }

  // Prep-task suggestions for meeting-like events in the next 48h.
  const soon = events.filter((event) => {
    const start = new Date(event.start).getTime();
    return start > now.getTime() && start < now.getTime() + 48 * 60 * 60 * 1000;
  });
  for (const event of soon) {
    if (!PREP_KEYWORDS.test(event.title)) continue;
    const already = todos.some((todo) => todo.text.toLowerCase().includes(event.title.toLowerCase().slice(0, 18)));
    if (already) continue;
    add(
      "todo_suggestion",
      `prep-${event.id}`,
      "Prep task suggested",
      `${event.title} at ${fmtTime(event.start)} looks like it may need preparation.`,
      "medium",
      [
        {
          label: "Add todo",
          action: "create_todo",
          requiresApproval: true,
          payload: { text: `Prepare for ${event.title}` }
        },
        { label: "Ignore", action: "dismiss", requiresApproval: false }
      ]
    );
    break; // keep the panel calm — one prep suggestion at a time
  }

  // System notices — calm, low priority, never error-styled.
  if (!hasAiProvider()) {
    add(
      "system_notice",
      "no-ai",
      "AI provider not configured",
      "Deterministic suggestions remain active. Add an API key in Settings to enable natural chat and richer summaries.",
      "low",
      [{ label: "Dismiss", action: "dismiss", requiresApproval: false }]
    );
  }

  return suggestions;
}

export async function dismissSuggestion(userId: string, id: string): Promise<void> {
  const state = await loadState(userId);
  state.dismissed[id] = new Date().toISOString();
  await saveState(userId, state);
}

export async function markAccepted(userId: string, id: string): Promise<void> {
  const state = await loadState(userId);
  state.accepted[id] = new Date().toISOString();
  await saveState(userId, state);
}
