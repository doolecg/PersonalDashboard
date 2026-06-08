import { useEffect, useState } from "react";
import { buildTickerTrack, getMillisecondsUntilNextTickerBucket, getTickerSeedBucket } from "./shellUi";
import type { TickerItem } from "./types";

function createSeededRandom(seed: number) {
  let state = (seed >>> 0) || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// A stable ticker order that only reshuffles on a fixed 15-minute time bucket.
// Shared by the Home footer and the Planner ticker so neither reshuffles on
// every React render (which made the feed appear to cycle/jump around).
export function useTickerTrack(tickerItems: TickerItem[]) {
  const [tickerSeedBucket, setTickerSeedBucket] = useState(() => getTickerSeedBucket(Date.now()));

  useEffect(() => {
    let timeoutId = 0;

    const scheduleNextBucket = () => {
      timeoutId = window.setTimeout(() => {
        setTickerSeedBucket(getTickerSeedBucket(Date.now()));
        scheduleNextBucket();
      }, getMillisecondsUntilNextTickerBucket(Date.now()));
    };

    scheduleNextBucket();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return buildTickerTrack(tickerItems, createSeededRandom(tickerSeedBucket));
}
