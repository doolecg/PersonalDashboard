import { rssLocalNews } from "../adapters/rssNewsProvider.js";
import { env } from "../env.js";
import { providerResult } from "./providerResult.js";
export async function getNews() {
    if (env.newsProvider === "none" || env.newsProvider === "disabled")
        return providerResult("empty", [], "News provider disabled");
    try {
        const data = await rssLocalNews();
        return providerResult(data.length ? "ok" : "empty", data);
    }
    catch (error) {
        return providerResult("error", [], error instanceof Error ? error.message : "News unavailable", "news");
    }
}
