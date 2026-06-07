const DEFAULT_TICKER_SOURCE = "Update";
const RSS_ITEM_PATTERN = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const RSS_TITLE_PATTERN = /<title>([\s\S]*?)<\/title>/i;
const RSS_LINK_PATTERN = /<link>([\s\S]*?)<\/link>/i;
function parseTickerItems(value) {
    return value
        .split("||")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((title) => ({ source: DEFAULT_TICKER_SOURCE, title, url: "" }));
}
function parseFeedEntries(value) {
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
function shuffleItems(items, random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}
function decodeXmlEntities(value) {
    return value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}
function extractRssItems(xml, source) {
    return [...xml.matchAll(RSS_ITEM_PATTERN)]
        .map((match) => {
        const itemXml = match[1] ?? "";
        const title = decodeXmlEntities(itemXml.match(RSS_TITLE_PATTERN)?.[1] ?? "");
        const url = decodeXmlEntities(itemXml.match(RSS_LINK_PATTERN)?.[1] ?? "");
        if (!title)
            return null;
        return { source, title, url };
    })
        .filter((item) => Boolean(item));
}
export async function resolveTickerItems(config, fetchFeed = fetch, random = Math.random) {
    const fallbackItems = parseTickerItems(config.footerTickerItems);
    const feedEntries = shuffleItems(parseFeedEntries(config.newsRssFeeds), random);
    if (!feedEntries.length)
        return fallbackItems;
    const titleGroups = await Promise.all(feedEntries.map(async ({ source, url }) => {
        try {
            const response = await fetchFeed(url);
            if (!response.ok)
                return [];
            return extractRssItems(await response.text(), source);
        }
        catch {
            return [];
        }
    }));
    const articleTitles = titleGroups.flat();
    return articleTitles.length ? articleTitles : fallbackItems;
}
