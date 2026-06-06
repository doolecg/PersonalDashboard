import { env } from "../env.js";
const feeds = () => env.newsFeeds
    .map((feed) => {
    const [source, url] = feed.split("|");
    return source && url ? { source, url } : null;
})
    .filter((feed) => Boolean(feed));
function decode(value) {
    return value
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
}
function tag(item, name) {
    const match = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
    return match ? decode(match[1]) : "";
}
function ageFromDate(value) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time))
        return "now";
    const minutes = Math.max(1, Math.round((Date.now() - time) / 60_000));
    if (minutes < 60)
        return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
}
function parseFeed(xml, source) {
    const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
    return items.slice(0, 5).map((item, index) => ({
        id: `${source.toLowerCase().replace(/\W+/g, "-")}-${index}-${tag(item, "guid") || tag(item, "link")}`,
        source,
        headline: tag(item, "title"),
        age: ageFromDate(tag(item, "pubDate")),
        url: tag(item, "link")
    }));
}
export async function rssLocalNews() {
    const results = await Promise.allSettled(feeds().map(async (feed) => {
        const response = await fetch(feed.url);
        if (!response.ok)
            throw new Error(`${feed.source} failed with ${response.status}`);
        return parseFeed(await response.text(), feed.source);
    }));
    return results
        .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
        .filter((item) => item.headline)
        .slice(0, 10);
}
