export type TickerItem = {
  source: string;
  title: string;
  url?: string;
};

export type ShellConfig = {
  userName: string;
  tickerItems: TickerItem[];
};

export type ConnectionTone = "online" | "offline";

export type ConnectionState = {
  label: string;
  tone: ConnectionTone;
};
