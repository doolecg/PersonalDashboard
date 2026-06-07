import type { ConnectionState, TickerItem } from "./types";

const EMPTY_TICKER_ITEM: TickerItem = { source: "Update", title: "No news updates configured", url: "" };
const TICKER_BUCKET_MS = 15 * 60 * 1000;

function shuffleItems<T>(items: T[], random: () => number) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function interleaveTickerItems(items: TickerItem[], random: () => number) {
  const itemsBySource = new Map<string, TickerItem[]>();

  for (const item of items) {
    const sourceItems = itemsBySource.get(item.source);
    if (sourceItems) {
      sourceItems.push(item);
      continue;
    }

    itemsBySource.set(item.source, [item]);
  }

  const sourceOrder = shuffleItems([...itemsBySource.keys()], random);
  const interleaved: TickerItem[] = [];
  let sourceIndex = 0;

  while (itemsBySource.size) {
    const source = sourceOrder[sourceIndex % sourceOrder.length];
    const sourceItems = source ? itemsBySource.get(source) : undefined;

    if (sourceItems?.length) {
      interleaved.push(sourceItems.shift() as TickerItem);

      if (!sourceItems.length) {
        itemsBySource.delete(source);
      }
    }

    sourceIndex += 1;
  }

  return interleaved;
}

export function buildTickerTrack(items: TickerItem[], random: () => number = Math.random) {
  const source = items.length ? interleaveTickerItems(items, random) : [EMPTY_TICKER_ITEM];
  return [...source, ...source];
}

export function getTickerSeedBucket(now: number) {
  return Math.floor(now / TICKER_BUCKET_MS);
}

export function getMillisecondsUntilNextTickerBucket(now: number) {
  const nextBucketStartsAt = (getTickerSeedBucket(now) + 1) * TICKER_BUCKET_MS;
  return nextBucketStartsAt - now;
}

export function getConnectionState(isOnline: boolean): ConnectionState {
  return isOnline
    ? { label: "Online", tone: "online" }
    : { label: "Offline", tone: "offline" };
}
