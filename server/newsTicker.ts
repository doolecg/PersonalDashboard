type NewsTickerEnvConfig = {
  footerTickerItems: string;
  newsRssFeeds: string;
};

type FetchLike = typeof fetch;

export type NewsTickerItem = {
  source: string;
  title: string;
  url: string;
};

const DEFAULT_TICKER_SOURCE = "Update";
const RSS_ITEM_PATTERN = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const RSS_TITLE_PATTERN = /<title>([\s\S]*?)<\/title>/i;
const RSS_LINK_PATTERN = /<link>([\s\S]*?)<\/link>/i;

function parseTickerItems(value: string) {
  return value
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((title) => ({ source: DEFAULT_TICKER_SOURCE, title, url: "" }));
}

function parseFeedEntries(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [source, url] = item.split("|");
      return {
        source: source?.trim() || DEFAULT_TICKER_SOURCE,
        url: url?.trim() || ""
      };
    })
    .filter((item) => item.url);
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractRssItems(xml: string, source: string): NewsTickerItem[] {
  return [...xml.matchAll(RSS_ITEM_PATTERN)]
    .map((match) => {
      const itemXml = match[1] ?? "";
      const title = decodeXmlEntities(itemXml.match(RSS_TITLE_PATTERN)?.[1] ?? "");
      const url = decodeXmlEntities(itemXml.match(RSS_LINK_PATTERN)?.[1] ?? "");

      if (!title) return null;
      return { source, title, url };
    })
    .filter((item): item is NewsTickerItem => Boolean(item));
}

export async function resolveTickerItems(config: NewsTickerEnvConfig, fetchFeed: FetchLike = fetch) {
  const fallbackItems = parseTickerItems(config.footerTickerItems);
  const feedEntries = parseFeedEntries(config.newsRssFeeds);

  if (!feedEntries.length) return fallbackItems;

  const titleGroups = await Promise.all(
    feedEntries.map(async ({ source, url }) => {
      try {
        const response = await fetchFeed(url);
        if (!response.ok) return [];
        return extractRssItems(await response.text(), source);
      } catch {
        return [];
      }
    })
  );

  const articleTitles = titleGroups.flat();
  return articleTitles.length ? articleTitles : fallbackItems;
}
