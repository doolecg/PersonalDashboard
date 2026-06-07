import { env } from "../env.js";
import { resolveTickerItems } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";
// AI summaries are slow and cost tokens, so cache for a while.
const ttlMs = 15 * 60 * 1000;
let cache = null;
export async function getNewsSummary() {
    if (cache && Date.now() - cache.at < ttlMs)
        return cache.data;
    const items = await resolveTickerItems({
        footerTickerItems: env.footerTickerItems,
        newsRssFeeds: env.newsRssFeeds
    });
    const headlines = items.slice(0, 12);
    let data;
    if (!headlines.length) {
        data = { summary: "No news available right now.", headlines: [], source: "headlines" };
    }
    else {
        try {
            const prompt = [
                "Summarise today's headlines into 4 short, calm bullet lines.",
                "One line per bullet, no markdown, no numbering, max 14 words each.",
                "Headlines:",
                ...headlines.map((item) => `- ${item.source}: ${item.title}`)
            ].join("\n");
            const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 220 });
            data = { summary: result.message.trim(), headlines: headlines.slice(0, 4), source: "ai" };
        }
        catch {
            // No AI available — fall back to the raw headlines.
            data = {
                summary: headlines.slice(0, 4).map((item) => `${item.source}: ${item.title}`).join("\n"),
                headlines: headlines.slice(0, 4),
                source: "headlines"
            };
        }
    }
    cache = { at: Date.now(), data };
    return data;
}
