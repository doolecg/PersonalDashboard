import type { ConnectionState, TickerItem } from "./types";

const EMPTY_TICKER_ITEM: TickerItem = { source: "Update", title: "No news updates configured", url: "" };

export function buildTickerTrack(items: TickerItem[]) {
  const source = items.length ? items : [EMPTY_TICKER_ITEM];
  return [...source, ...source];
}

export function getConnectionState(isOnline: boolean): ConnectionState {
  return isOnline
    ? { label: "Online", tone: "online" }
    : { label: "Offline", tone: "offline" };
}
