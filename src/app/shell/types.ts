export type ShellConfig = {
  userName: string;
  tickerItems: string[];
};

export type ConnectionTone = "online" | "offline";

export type ConnectionState = {
  label: string;
  tone: ConnectionTone;
};
