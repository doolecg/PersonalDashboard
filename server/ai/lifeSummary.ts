import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";

export type LifeSummaryEvent = {
  title: string;
  start: string;
  end?: string;
  location?: string;
  category?: string;
};

export type LifeSummary = { summary: string; source: "ai" | "fallback" };

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

// Deterministically compose a real, informative summary straight from the
// dashboard data. Used when no AI provider responds so the box still reflects
// the user's actual events, tasks, reminders, news, and weather — never a thin
// generic line.
function composeFallback(
  events: LifeSummaryEvent[],
  weather: string | undefined,
  tasks: string[],
  reminders: string[],
  advice: string | undefined
): string {
  // A single, data-rich paragraph describing the user's day.
  const today: string[] = [];
  if (weather) today.push(`It's ${weather} today${advice ? `, so ${advice}` : ""}.`);
  else if (advice) today.push(`Today, ${advice}.`);

  if (events.length) {
    const next = events[0];
    const when = formatWhen(next.start);
    today.push(
      `You have ${events.length} event${events.length > 1 ? "s" : ""} on, next is ${next.title}${when ? ` at ${when}` : ""}.`
    );
  }

  if (tasks.length) {
    today.push(`${tasks.length} task${tasks.length > 1 ? "s" : ""} to do: ${tasks.slice(0, 4).join(", ")}.`);
  }

  if (reminders.length) {
    today.push(`Don't forget ${reminders.slice(0, 3).join(", ")}.`);
  }

  if (!today.length) return "Nothing on your plate right now, and a clear day ahead.";
  return today.join(" ");
}

// AI calls are slow (and, with a flaky local model, can fail after several
// seconds). Cache by input signature and coalesce concurrent identical requests
// so a re-rendering card can't stampede the provider.
const ttlMs = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: LifeSummary }>();
const inflight = new Map<string, Promise<LifeSummary>>();

function cacheKey(
  events: LifeSummaryEvent[],
  weather: string | undefined,
  tasks: string[],
  reminders: string[],
  news: string[],
  advice: string | undefined
) {
  return JSON.stringify({
    events: events.map((event) => `${event.start}|${event.title}`),
    weather: weather ?? "",
    tasks,
    reminders,
    news,
    advice: advice ?? ""
  });
}

// A warm, plain-language summary of the user's day, drawn from their whole
// dashboard. Falls back to a deterministic, data-rich summary when no AI
// provider is available. Cached + coalesced (see above).
export function generateLifeSummary(
  events: LifeSummaryEvent[],
  weather?: string,
  tasks: string[] = [],
  reminders: string[] = [],
  news: string[] = [],
  advice?: string
): Promise<LifeSummary> {
  const key = cacheKey(events, weather, tasks, reminders, news, advice);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < ttlMs) return Promise.resolve(cached.data);

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = buildLifeSummary(events, weather, tasks, reminders, news, advice)
    .then((data) => {
      cache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

async function buildLifeSummary(
  events: LifeSummaryEvent[],
  weather?: string,
  tasks: string[] = [],
  reminders: string[] = [],
  news: string[] = [],
  advice?: string
): Promise<LifeSummary> {
  if (!events.length && !weather && !tasks.length && !reminders.length && !news.length) {
    return { summary: "Nothing on your plate right now, and a clear day ahead.", source: "fallback" };
  }

  const lines = events
    .slice(0, 12)
    .map((event) => `- ${formatWhen(event.start)} ${event.title}${event.location ? ` @ ${event.location}` : ""}`);

  const prompt = [
    "Write the user a short single-paragraph brief of their day in plain text.",
    "Cover what they need to do — their events and tasks and reminders — plus practical weather advice on what to wear and whether to bring an umbrella or sun cream.",
    "Keep it to 2-4 sentences. No markdown, no asterisks, no quotation marks, no parentheses, no bullet points.",
    weather ? `Weather: ${weather}.` : "",
    advice ? `Weather advice to include: ${advice}.` : "",
    events.length ? `Today's events:\n${lines.join("\n")}` : "No events scheduled today.",
    tasks.length ? `Open tasks: ${tasks.slice(0, 8).join("; ")}.` : "",
    reminders.length ? `Reminders: ${reminders.slice(0, 8).join("; ")}.` : ""
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 400 });
    const message = result.message.trim();
    // Even on a "successful" route, guard against an empty/blank model reply.
    if (message) return { summary: message, source: "ai" };
  } catch {
    // fall through to the composed fallback below
  }

  return { summary: composeFallback(events, weather, tasks, reminders, advice), source: "fallback" };
}
