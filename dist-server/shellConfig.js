const DEFAULT_USER_NAME = "Aura";
const DEFAULT_TICKER_SOURCE = "Update";
export function buildShellConfig(config, tickerItems) {
    const userName = config.headerUserName.trim() || DEFAULT_USER_NAME;
    const fallbackTickerItems = config.footerTickerItems
        .split("||")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((title) => ({ source: DEFAULT_TICKER_SOURCE, title, url: "" }));
    return { userName, tickerItems: tickerItems ?? fallbackTickerItems };
}
