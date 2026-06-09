import { env } from "../env.js";
import { resolveTickerItemsBalanced, type NewsTickerItem } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";

export type TldrHeadline = { title: string; url?: string; image?: string; source: string; description?: string };
export type TldrTopic = { label: string; suggestions: string[]; headlines: TldrHeadline[] };
export type TldrSummary = { topics: TldrTopic[] };

const ttlMs = 15 * 60 * 1000;
let cache: { at: number; data: TldrSummary } | null = null;

const TOPICS: Array<{ label: string; feeds: string }> = [
  { label: "Tech", feeds: env.designTopicRssFeeds },
  { label: "AI", feeds: env.aiTopicRssFeeds },
  { label: "Dev", feeds: env.devTopicRssFeeds },
  { label: "DevOps", feeds: env.itTopicRssFeeds }
];

function fallbackSuggestions(pool: NewsTickerItem[], label: string): string[] {
  if (!pool.length) return [`Latest ${label} trends`, `${label} tools and frameworks`, `${label} best practices`];
  return pool.slice(0, 4).map((item) => item.title.replace(/[🤖💻🚀📱💰🥷⚡️✨📝🔍⚖️🧱☁️🪐🦀🔮🧪]/gu, "").trim());
}

async function topicSuggestions(label: string, feeds: string): Promise<TldrTopic> {
  const raw = await resolveTickerItemsBalanced({ footerTickerItems: "", newsRssFeeds: feeds }, 4);
  const pool = (raw as NewsTickerItem[]).slice(0, 16);
  const headlines: TldrHeadline[] = pool.slice(0, 6).map((item) => ({
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

    if (lines.length >= 2) return { label, suggestions: lines.slice(0, 5), headlines };
  } catch {
    // fall through to fallback
  }

  return { label, suggestions: fallbackSuggestions(pool, label), headlines };
}

export async function getTldrSummaries(force = false): Promise<TldrSummary> {
  if (!force && cache && Date.now() - cache.at < ttlMs) return cache.data;
  const topics = await Promise.all(TOPICS.map((topic) => topicSuggestions(topic.label, topic.feeds)));
  const data: TldrSummary = { topics };
  cache = { at: Date.now(), data };
  return data;
}
