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

// A warm, plain-language summary of the user's day, drawn from their calendar
// events (and optionally a short weather note). Falls back to a deterministic
// line when no AI provider is available.
export async function generateLifeSummary(events: LifeSummaryEvent[], weather?: string): Promise<LifeSummary> {
  if (!events.length && !weather) {
    return { summary: "Nothing on your calendar — a clear day ahead.", source: "fallback" };
  }

  const lines = events
    .slice(0, 12)
    .map((event) => `- ${formatWhen(event.start)} ${event.title}${event.location ? ` @ ${event.location}` : ""}`);

  const prompt = [
    "Summarise the user's day in 3 short, warm, practical lines.",
    "No markdown, no bullets, one sentence per line, max 16 words each.",
    "Mention the shape of the day, any notable gap, and one gentle suggestion.",
    weather ? `Weather: ${weather}.` : "",
    events.length ? `Today's events:\n${lines.join("\n")}` : "No events scheduled today."
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 200 });
    return { summary: result.message.trim(), source: "ai" };
  } catch {
    const fallback = events.length
      ? `You have ${events.length} event${events.length > 1 ? "s" : ""} today. Next up: ${events[0].title} at ${formatWhen(events[0].start)}.`
      : "A clear day ahead.";
    return { summary: fallback, source: "fallback" };
  }
}
