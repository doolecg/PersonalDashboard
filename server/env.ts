import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (key: string, fallback: number) => {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: numberFromEnv("PORT", 8080),
  nodeEnv: process.env.NODE_ENV ?? "development",
  dataDir: process.env.DATA_DIR ?? "./data",
  defaultCity: process.env.DEFAULT_CITY ?? "Local",
  defaultLat: numberFromEnv("DEFAULT_LAT", 53.373),
  defaultLon: numberFromEnv("DEFAULT_LON", -3.016),
  weatherProvider: process.env.WEATHER_PROVIDER ?? "ensemble",
  headerUserName: process.env.HEADER_USER_NAME ?? "",
  footerTickerItems: process.env.FOOTER_TICKER_ITEMS ?? "",
  newsRssFeeds: process.env.NEWS_RSS_FEEDS ?? "BBC News|https://feeds.bbci.co.uk/news/rss.xml,Reuters|https://www.reutersagency.com/feed/?taxonomy=best-topics&output=rss",
  globalNewsRssFeeds: process.env.GLOBAL_NEWS_RSS_FEEDS ?? "BBC News|https://feeds.bbci.co.uk/news/rss.xml,Reuters|https://www.reutersagency.com/feed/?taxonomy=best-topics&output=rss,The Guardian|https://www.theguardian.com/world/rss",
  techNewsRssFeeds: process.env.TECH_NEWS_RSS_FEEDS ?? "Hacker News|https://news.ycombinator.com/rss,Ars Technica|https://feeds.arstechnica.com/arstechnica/index",
  scienceNewsRssFeeds: process.env.SCIENCE_NEWS_RSS_FEEDS ?? "Science Daily|https://www.sciencedaily.com/rss/all.xml,New Scientist|https://www.newscientist.com/feed/home",
  aiTopicRssFeeds: process.env.AI_NEWS_RSS_FEEDS ?? "VentureBeat AI|https://venturebeat.com/category/ai/feed/,The Verge AI|https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  devTopicRssFeeds: process.env.DEV_NEWS_RSS_FEEDS ?? "Hacker News|https://news.ycombinator.com/rss,Dev.to|https://dev.to/feed",
  designTopicRssFeeds: process.env.DESIGN_NEWS_RSS_FEEDS ?? "Smashing Magazine|https://www.smashingmagazine.com/feed/,Designer News|https://www.designernews.co/?format=rss",
  itTopicRssFeeds: process.env.IT_NEWS_RSS_FEEDS ?? "BleepingComputer|https://www.bleepingcomputer.com/feed/,The Register|https://www.theregister.com/headlines.atom",
  aiRoutingMode: process.env.AI_ROUTING_MODE ?? "openrouter",
  aiTimeoutMs: numberFromEnv("AI_TIMEOUT_MS", 30000),
  aiMaxContextChars: numberFromEnv("AI_MAX_CONTEXT_CHARS", 4000),
  aiPrivacyMode: process.env.AI_PRIVACY_MODE ?? "high",
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  openRouterModel: process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free",
  openRouterFreeModels: (process.env.OPENROUTER_FREE_MODELS ?? [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "poolside/laguna-m.1:free",
    "poolside/laguna-xs.2:free",
    "moonshotai/kimi-k2.6:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "z-ai/glm-4.5-air:free"
  ].join(",")).split(",").map((item) => item.trim()).filter(Boolean),
  openRouterSiteUrl: process.env.OPENROUTER_SITE_URL ?? "https://aura.example.com",
  openRouterAppName: process.env.OPENROUTER_APP_NAME ?? "Aura",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiBaseUrl: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL ?? "qwen3:1.7b",
  openAiCompatBaseUrl: process.env.OPENAI_COMPAT_BASE_URL ?? "http://localhost:8081/v1",
  openAiCompatModel: process.env.OPENAI_COMPAT_MODEL ?? "local-model",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:8080/api/google/callback",
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary"
};
