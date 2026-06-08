import { env } from "../env.js";
import { resolveTickerItems, type NewsTickerItem } from "../newsTicker.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { routeAiComplete } from "../providers/aiRuntime.js";

export type TldrHeadline = { title: string; url?: string; image?: string; source: string };
export type TldrTopic = { label: string; tldr: string; source: "ai" | "headlines"; headlines: TldrHeadline[] };
export type TldrSummary = { topics: TldrTopic[] };

const ttlMs = 15 * 60 * 1000;
let cache: { at: number; data: TldrSummary } | null = null;

const TOPICS: Array<{ label: string; feeds: string }> = [
  { label: "AI", feeds: env.aiTopicRssFeeds },
  { label: "Dev", feeds: env.devTopicRssFeeds },
  { label: "Design", feeds: env.designTopicRssFeeds },
  { label: "IT", feeds: env.itTopicRssFeeds }
];

async function topicTldr(label: string, feeds: string): Promise<TldrTopic> {
  const raw = await resolveTickerItems({ footerTickerItems: "", newsRssFeeds: feeds });
  const pool = (raw as NewsTickerItem[]).slice(0, 16);
  const headlines: TldrHeadline[] = pool.slice(0, 6).map((item) => ({
    title: item.title,
    url: item.url || undefined,
    image: item.image || undefined,
    source: item.source
  }));

  if (!pool.length) return { label, tldr: `No ${label} news right now.`, source: "headlines" as const, headlines: [] };

  try {
    const prompt = [
      `Write a single punchy 10-15 word TLDR of today's top ${label} news.`,
      "No preamble, no markdown, no quotation marks — just the sentence itself.",
      "Headlines:",
      ...pool.map((item) => `- ${item.source}: ${item.title}`)
    ].join("\n");
    const result = await routeAiComplete({ messages: messagesFromPrompt(prompt), maxTokens: 80 });
    const message = result.message.trim();
    if (message) return { label, tldr: message, source: "ai", headlines };
  } catch {
    // fall through to headline
  }
  return { label, tldr: pool[0].title, source: "headlines", headlines };
}

export async function getTldrSummaries(force = false): Promise<TldrSummary> {
  if (!force && cache && Date.now() - cache.at < ttlMs) return cache.data;
  const topics = await Promise.all(TOPICS.map((topic) => topicTldr(topic.label, topic.feeds)));
  const data: TldrSummary = { topics };
  cache = { at: Date.now(), data };
  return data;
}
