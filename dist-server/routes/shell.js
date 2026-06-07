import { Router } from "express";
import { env } from "../env.js";
import { resolveTickerItems } from "../newsTicker.js";
import { buildShellConfig } from "../shellConfig.js";
export const shellRouter = Router();
export function getShellConfigResponse(config, tickerItems = buildShellConfig(config).tickerItems) {
    return buildShellConfig(config, tickerItems);
}
shellRouter.get("/", async (_req, res, next) => {
    try {
        const tickerItems = await resolveTickerItems({
            footerTickerItems: env.footerTickerItems,
            newsRssFeeds: env.newsRssFeeds
        });
        res.json(getShellConfigResponse({
            headerUserName: env.headerUserName,
            footerTickerItems: ""
        }, tickerItems));
    }
    catch (error) {
        next(error);
    }
});
