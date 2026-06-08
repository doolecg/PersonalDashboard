import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";
import type { WeatherWidgetPayload } from "./types.js";

export type WeatherReport = {
  report: string;
  insight: string;
  source: "openai" | "generated";
};

function formatClock(time?: string) {
  if (!time) return undefined;
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

// First hour where measurable rain or a meaningful chance of rain begins.
function findRainStart(payload: WeatherWidgetPayload) {
  return payload.precipitation.points.find(
    (point) => point.precipitationMm > 0.05 || point.probability >= 40,
  );
}

// Deterministic one-line trend, used as the "Weather insight" line and as part
// of the fallback report. Compares today's high with the day two out.
export function buildWeatherInsight(payload: WeatherWidgetPayload): string {
  const days = payload.daily;
  const todayHigh = days[0]?.highC;
  const laterHigh = days[2]?.highC ?? days[days.length - 1]?.highC;

  if (typeof todayHigh === "number" && typeof laterHigh === "number") {
    const delta = Math.round(laterHigh - todayHigh);
    if (delta <= -2) return `Cooling expected over the next ${Math.min(2, days.length - 1)} days`;
    if (delta >= 2) return `Warming up over the next ${Math.min(2, days.length - 1)} days`;
  }

  const wettest = Math.max(0, ...days.slice(0, 3).map((day) => Math.round(day.probability ?? 0)));
  if (wettest >= 60) return "An unsettled, wet spell is on the way";
  if (wettest <= 20) return "Settled, mostly dry conditions ahead";
  return "Steady conditions over the coming days";
}

export function buildFallbackReport(payload: WeatherWidgetPayload): string {
  const { conditionLabel, temperatureC } = payload.current;
  const condition = conditionLabel.toLowerCase();
  const rainStart = findRainStart(payload);
  const startClock = formatClock(rainStart?.time);

  if (rainStart && startClock) {
    return `Currently ${condition} at ${Math.round(temperatureC)}°. Keep an umbrella handy — rain is likely from around ${startClock}.`;
  }
  return `Currently ${condition} at ${Math.round(temperatureC)}°, with no significant rain expected in the next few hours.`;
}

function buildPrompt(payload: WeatherWidgetPayload): string {
  const rainStart = findRainStart(payload);
  const startClock = formatClock(rainStart?.time);
  const next = payload.hourly.slice(0, 8).map((hour) => `${hour.label}: ${Math.round(hour.temperatureC ?? 0)}°, ${Math.round(hour.probability ?? 0)}% rain`).join("; ");
  const days = payload.daily.slice(0, 4).map((day) => `${day.label}: ${Math.round(day.highC ?? 0)}°/${Math.round(day.lowC ?? 0)}°, ${Math.round(day.probability ?? 0)}% rain`).join("; ");

  return [
    `Write a warm, flowing weather report paragraph for ${payload.current.location}, 3 to 4 sentences.`,
    "Cover the conditions now, how the next few hours and the coming days look, and give practical advice on what to wear and whether to bring an umbrella.",
    "Be friendly, like a phone weather app. Plain text only: no markdown, no lists, no emoji, no quotation marks.",
    `Now: ${payload.current.conditionLabel}, ${Math.round(payload.current.temperatureC)}°.`,
    rainStart && startClock ? `Rain likely from about ${startClock}.` : "No notable rain in the next few hours.",
    `Next hours — ${next}.`,
    `Coming days — ${days}.`,
  ].join("\n");
}

export async function generateWeatherReport(payload: WeatherWidgetPayload): Promise<string> {
  // Route through the provider chain so the report works with whatever AI is
  // configured (OpenRouter, OpenAI, Gemini, or a local model) — not OpenAI only.
  const result = await routeAiComplete({
    messages: messagesFromPrompt(buildPrompt(payload)),
    maxTokens: 320,
  });
  const text = result.message.trim();
  if (!text) throw new Error("AI returned an empty weather report.");
  return text;
}
