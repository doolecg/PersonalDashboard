import { env } from "../env.js";
import { resolveTickerItemsBalanced } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";
const ttlMs = 15 * 60 * 1000;
let cache = null;
const TOPICS = [
    { label: "Tech", feeds: env.designTopicRssFeeds },
    { label: "AI", feeds: env.aiTopicRssFeeds },
    { label: "Dev", feeds: env.devTopicRssFeeds },
    { label: "DevOps", feeds: env.itTopicRssFeeds }
];
function fallbackSuggestions(pool, label) {
    if (!pool.length)
        return [`Latest ${label} trends`, `${label} tools and frameworks`, `${label} best practices`];
    return pool.slice(0, 4).map((item) => item.title.replace(/[🤖💻🚀📱💰🥷⚡️✨📝🔍⚖️🧱☁️🪐🦀🔮🧪]/gu, "").trim());
}
async function topicSuggestions(label, feeds) {
    const raw = await resolveTickerItemsBalanced({ footerTickerItems: "", newsRssFeeds: feeds }, 4);
    const pool = raw.slice(0, 16);
    const headlines = pool.slice(0, 6).map((item) => ({
        title: item.title,
        url: item.url || undefined,
        image: item.image || undefined,
        source: item.source,
        description: item.description
    }));
    if (!pool.length) {
        return { label, suggestions: fallbackSuggestions(pool, label), headlines: [] };
    }
    try {
        const prompt = [
            `You are a research assistant. Based on these ${label} newsletter headlines, generate exactly 5 concise research topics suitable for searching in NotebookLM.`,
            "Each topic should be a clear phrase (4-8 words) capturing an underlying concept or technology worth researching — not a news event summary.",
            "Return one topic per line. No bullets, no numbers, no markdown, no extra text.",
            "Headlines:",
            ...pool.slice(0, 10).map((item) => `- ${item.title}`)
        ].join("\n");
        const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 120 });
        const lines = result.message
            .split("\n")
            .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
            .filter((l) => l.length > 4 && l.length < 80);
        if (lines.length >= 2)
            return { label, suggestions: lines.slice(0, 5), headlines };
    }
    catch {
        // fall through to fallback
    }
    return { label, suggestions: fallbackSuggestions(pool, label), headlines };
}
export async function getTldrSummaries(force = false) {
    if (!force && cache && Date.now() - cache.at < ttlMs)
        return cache.data;
    const topics = await Promise.all(TOPICS.map((topic) => topicSuggestions(topic.label, topic.feeds)));
    const data = { topics };
    cache = { at: Date.now(), data };
    return data;
}
