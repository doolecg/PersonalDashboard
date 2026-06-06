export type ShellEnvConfig = {
  headerUserName: string;
  footerTickerItems: string;
};

export type ShellConfig = {
  userName: string;
  tickerItems: string[];
};

const DEFAULT_USER_NAME = "User";

export function buildShellConfig(config: ShellEnvConfig): ShellConfig {
  const userName = config.headerUserName.trim() || DEFAULT_USER_NAME;
  const tickerItems = config.footerTickerItems
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);

  return { userName, tickerItems };
}
