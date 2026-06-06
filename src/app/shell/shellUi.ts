import type { ConnectionState } from "./types";

const EMPTY_TICKER_MESSAGE = "No news updates configured";

export function buildTickerTrack(items: string[]) {
  const source = items.length ? items : [EMPTY_TICKER_MESSAGE];
  return [...source, ...source];
}

export function getConnectionState(isOnline: boolean): ConnectionState {
  return isOnline
    ? { label: "Online", tone: "online" }
    : { label: "Offline", tone: "offline" };
}
