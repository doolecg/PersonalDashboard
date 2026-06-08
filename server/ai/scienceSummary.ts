import { env } from "../env.js";
import { resolveTickerItemsBalanced, type NewsTickerItem } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";

export type ScienceSummary = {
  summary: string;
  headlines: NewsTickerItem[];
  source: "ai" | "headlines";
};

const ttlMs = 15 * 60 * 1000;
let cache: { at: number; data: ScienceSummary } | null = null;

export async function getScienceSummary(force = false): Promise<ScienceSummary> {
  if (!force && cache && Date.now() - cache.at < ttlMs) return cache.data;

  const items = await resolveTickerItemsBalanced({
    footerTickerItems: "",
    newsRssFeeds: env.scienceNewsRssFeeds
  }, 5);
  const headlines = items.slice(0, 20);

  let data: ScienceSummary;
  if (!headlines.length) {
    data = { summary: "No science news available right now.", headlines: [], source: "headlines" };
  } else {
    try {
      const prompt = [
        "Summarise today's most interesting space and science news in 3–4 sentences. Prioritise space exploration, launches, and astronomy; include other notable science findings if space news is sparse. Lead with the most significant story.",
        "Plain text only: no markdown, no bullet points, no numbering, no quotation marks.",
        "Headlines:",
        ...headlines.map((item) => `- ${item.source}: ${item.title}`)
      ].join("\n");
      const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 400 });
      const message = result.message.trim();
      if (!message) throw new Error("Empty science summary.");
      data = { summary: message, headlines, source: "ai" };
    } catch {
      data = {
        summary: headlines.slice(0, 6).map((item) => `${item.source}: ${item.title}.`).join(" "),
        headlines,
        source: "headlines"
      };
    }
  }

  cache = { at: Date.now(), data };
  return data;
}
