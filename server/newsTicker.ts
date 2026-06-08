type NewsTickerEnvConfig = {
  footerTickerItems: string;
  newsRssFeeds: string;
};

type FetchLike = typeof fetch;

export type NewsTickerItem = {
  source: string;
  title: string;
  url: string;
  image?: string;
};

const DEFAULT_TICKER_SOURCE = "Update";
const RSS_ITEM_PATTERN = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const RSS_TITLE_PATTERN = /<title>([\s\S]*?)<\/title>/i;
const RSS_LINK_PATTERN = /<link>([\s\S]*?)<\/link>/i;

// Image can live in a few RSS extensions; try them in rough order of quality.
const RSS_IMAGE_PATTERNS = [
  /<media:content[^>]*\burl="([^"]+)"[^>]*>/i,
  /<media:thumbnail[^>]*\burl="([^"]+)"[^>]*>/i,
  /<enclosure[^>]*\burl="([^"]+)"[^>]*type="image\/[^"]*"/i,
  /<enclosure[^>]*type="image\/[^"]*"[^>]*\burl="([^"]+)"/i,
  /<img[^>]*\bsrc="([^"]+)"/i
];

function extractImage(itemXml: string): string | undefined {
  for (const pattern of RSS_IMAGE_PATTERNS) {
    const match = itemXml.match(pattern);
    if (match?.[1]) {
      const url = match[1].trim();
      if (/^https?:\/\//i.test(url)) return url;
    }
  }
  return undefined;
}

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

function shuffleItems<T>(items: T[], random: () => number) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  trade: "™",
  copy: "©",
  reg: "®"
};

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ") // strip stray HTML tags that some feeds embed in titles
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ") // collapse whitespace/newlines so the ticker reads on one line
    .trim();
}

function extractRssItems(xml: string, source: string): NewsTickerItem[] {
  return [...xml.matchAll(RSS_ITEM_PATTERN)]
    .map((match): NewsTickerItem | null => {
      const itemXml = match[1] ?? "";
      const title = decodeXmlEntities(itemXml.match(RSS_TITLE_PATTERN)?.[1] ?? "");
      const url = decodeXmlEntities(itemXml.match(RSS_LINK_PATTERN)?.[1] ?? "");
      const image = extractImage(itemXml);

      if (!title) return null;
      return { source, title, url, image };
    })
    .filter((item): item is NewsTickerItem => item !== null);
}

export async function resolveTickerItems(config: NewsTickerEnvConfig, fetchFeed: FetchLike = fetch, random: () => number = Math.random) {
  const fallbackItems = parseTickerItems(config.footerTickerItems);
  const feedEntries = shuffleItems(parseFeedEntries(config.newsRssFeeds), random);

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

/**
 * Like resolveTickerItems but guarantees one article per source before cycling
 * back for second articles. Each feed contributes at most `maxPerFeed` items so
 * no single source can dominate the result.
 */
export async function resolveTickerItemsBalanced(
  config: NewsTickerEnvConfig,
  maxPerFeed = 5,
  fetchFeed: FetchLike = fetch,
  random: () => number = Math.random
): Promise<NewsTickerItem[]> {
  const fallbackItems = parseTickerItems(config.footerTickerItems);
  const feedEntries = shuffleItems(parseFeedEntries(config.newsRssFeeds), random);

  if (!feedEntries.length) return fallbackItems;

  const groups = await Promise.all(
    feedEntries.map(async ({ source, url }) => {
      try {
        const response = await fetchFeed(url);
        if (!response.ok) return [] as NewsTickerItem[];
        // Shuffle within each feed so refresh gives different articles.
        return shuffleItems(extractRssItems(await response.text(), source), random).slice(0, maxPerFeed);
      } catch {
        return [] as NewsTickerItem[];
      }
    })
  );

  // Round-robin: one article from each feed in turn, cycling until all exhausted.
  const result: NewsTickerItem[] = [];
  const maxDepth = Math.max(0, ...groups.map((g) => g.length));
  for (let depth = 0; depth < maxDepth; depth++) {
    for (const group of groups) {
      const item = group[depth];
      if (item) result.push(item);
    }
  }
  return result.length ? result : fallbackItems;
}
