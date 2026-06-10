import { env } from "../env.js";
import { resolveTickerItemsBalanced } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";
const ttlMs = 15 * 60 * 1000;
let cache = null;
export async function getTechSummary(force = false) {
    if (!force && cache && Date.now() - cache.at < ttlMs)
        return cache.data;
    const items = await resolveTickerItemsBalanced({
        footerTickerItems: "",
        newsRssFeeds: env.techNewsRssFeeds
    }, 5);
    const headlines = items.slice(0, 20);
    let data;
    if (!headlines.length) {
        data = { summary: "No tech news available right now.", headlines: [], source: "headlines" };
    }
    else {
        try {
            const prompt = [
                "Summarise today's top tech news in 3–4 sentences, covering AI advances, developer tools/releases, and hardware announcements. Lead with the most impactful story.",
                "Plain text only: no markdown, no bullet points, no numbering, no quotation marks.",
                "Headlines:",
                ...headlines.map((item) => `- ${item.source}: ${item.title}`)
            ].join("\n");
            const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 400 });
            const message = result.message.trim();
            if (!message)
                throw new Error("Empty tech summary.");
            data = { summary: message, headlines, source: "ai" };
        }
        catch {
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
