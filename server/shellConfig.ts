import type { NewsTickerItem } from "./newsTicker.js";

export type ShellEnvConfig = {
  headerUserName: string;
  footerTickerItems: string;
};

export type ShellConfig = {
  userName: string;
  tickerItems: NewsTickerItem[];
};

const DEFAULT_USER_NAME = "Aura";
const DEFAULT_TICKER_SOURCE = "Update";

export function buildShellConfig(config: ShellEnvConfig, tickerItems?: NewsTickerItem[]): ShellConfig {
  const userName = config.headerUserName.trim() || DEFAULT_USER_NAME;
  const fallbackTickerItems = config.footerTickerItems
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((title) => ({ source: DEFAULT_TICKER_SOURCE, title, url: "" }));

  return { userName, tickerItems: tickerItems ?? fallbackTickerItems };
}
