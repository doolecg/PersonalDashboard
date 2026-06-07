import { createOpenAiProvider } from "../adapters/openAiProvider.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
function formatClock(time) {
    if (!time)
        return undefined;
    const date = new Date(time);
    if (Number.isNaN(date.getTime()))
        return undefined;
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}
// First hour where measurable rain or a meaningful chance of rain begins.
function findRainStart(payload) {
    return payload.precipitation.points.find((point) => point.precipitationMm > 0.05 || point.probability >= 40);
}
// Deterministic one-line trend, used as the "Weather insight" line and as part
// of the fallback report. Compares today's high with the day two out.
export function buildWeatherInsight(payload) {
    const days = payload.daily;
    const todayHigh = days[0]?.highC;
    const laterHigh = days[2]?.highC ?? days[days.length - 1]?.highC;
    if (typeof todayHigh === "number" && typeof laterHigh === "number") {
        const delta = Math.round(laterHigh - todayHigh);
        if (delta <= -2)
            return `Cooling expected over the next ${Math.min(2, days.length - 1)} days`;
        if (delta >= 2)
            return `Warming up over the next ${Math.min(2, days.length - 1)} days`;
    }
    const wettest = Math.max(0, ...days.slice(0, 3).map((day) => Math.round(day.probability ?? 0)));
    if (wettest >= 60)
        return "An unsettled, wet spell is on the way";
    if (wettest <= 20)
        return "Settled, mostly dry conditions ahead";
    return "Steady conditions over the coming days";
}
export function buildFallbackReport(payload) {
    const { conditionLabel, temperatureC } = payload.current;
    const condition = conditionLabel.toLowerCase();
    const rainStart = findRainStart(payload);
    const startClock = formatClock(rainStart?.time);
    if (rainStart && startClock) {
        return `Currently ${condition} at ${Math.round(temperatureC)}°. Keep an umbrella handy — rain is likely from around ${startClock}.`;
    }
    return `Currently ${condition} at ${Math.round(temperatureC)}°, with no significant rain expected in the next few hours.`;
}
function buildPrompt(payload) {
    const rainStart = findRainStart(payload);
    const startClock = formatClock(rainStart?.time);
    const next = payload.hourly.slice(0, 8).map((hour) => `${hour.label}: ${Math.round(hour.temperatureC ?? 0)}°, ${Math.round(hour.probability ?? 0)}% rain`).join("; ");
    const days = payload.daily.slice(0, 4).map((day) => `${day.label}: ${Math.round(day.highC ?? 0)}°/${Math.round(day.lowC ?? 0)}°, ${Math.round(day.probability ?? 0)}% rain`).join("; ");
    return [
        `Write a short, warm weather report for ${payload.current.location} in 1-2 sentences (max 40 words).`,
        "Be practical and friendly, like a phone weather app. Do not use markdown, lists, or emoji.",
        `Now: ${payload.current.conditionLabel}, ${Math.round(payload.current.temperatureC)}°.`,
        rainStart && startClock ? `Rain likely from about ${startClock}.` : "No notable rain in the next few hours.",
        `Next hours — ${next}.`,
        `Coming days — ${days}.`,
    ].join("\n");
}
export async function generateWeatherReport(payload) {
    const provider = createOpenAiProvider();
    const message = await provider.complete({
        messages: messagesFromPrompt(buildPrompt(payload)),
        maxTokens: 160,
    });
    const text = message.trim();
    if (!text)
        throw new Error("OpenAI returned an empty weather report.");
    return text;
}
