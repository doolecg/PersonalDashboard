import { env } from "../env.js";
import { resolveTickerItemsBalanced, type NewsTickerItem } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";

export type NewsSummary = {
  summary: string;
  headlines: NewsTickerItem[];
  source: "ai" | "headlines";
};

// AI summaries are slow and cost tokens, so cache for a while.
const ttlMs = 15 * 60 * 1000;
let cache: { at: number; data: NewsSummary } | null = null;

export async function getNewsSummary(force = false): Promise<NewsSummary> {
  if (!force && cache && Date.now() - cache.at < ttlMs) return cache.data;

  // Merge global sources with local NEWS_RSS_FEEDS so Top Stories always has
  // variety across both national/world feeds and user-configured local feeds.
  const combined = [env.globalNewsRssFeeds, env.newsRssFeeds].filter(Boolean).join(",");
  const items = await resolveTickerItemsBalanced({
    footerTickerItems: env.footerTickerItems,
    newsRssFeeds: combined
  }, 5);
  const headlines = items.slice(0, 25);

  let data: NewsSummary;
  if (!headlines.length) {
    data = { summary: "No news available right now.", headlines: [], source: "headlines" };
  } else {
    try {
      const prompt = [
        "Write a structured news brief from the headlines below.",
        "Format exactly as follows, each on its own line:",
        "First line: a single sentence naming today's single most important story.",
        "Then 3 to 4 further lines, each starting with a short theme label followed by a colon and one sentence grouping related stories under that theme (for example 'World: ...', 'Politics: ...', 'Business: ...', 'Sport: ...').",
        "Use only themes that the headlines actually support. Direct, factual tone.",
        "Plain text only: no markdown, no bold, no bullet points, no numbering, no quotation marks. One line per item, separated by single newlines.",
        "Headlines:",
        ...headlines.map((item) => `- ${item.source}: ${item.title}`)
      ].join("\n");
      const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 400 });
      const message = result.message.trim();
      if (!message) throw new Error("Empty news summary.");
      data = { summary: message, headlines, source: "ai" };
    } catch {
      // No AI available — fall back to a plain run-through of the headlines.
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
