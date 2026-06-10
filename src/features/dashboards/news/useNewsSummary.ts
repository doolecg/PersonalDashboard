import { apiFetch } from "@/app/http";
import { useSyncExternalStore } from "react";
import type { NewsTickerItem } from "@/types/models";

export type NewsSummary = {
  summary: string;
  headlines: NewsTickerItem[];
  source: "ai" | "headlines";
};

type Snapshot = { data: NewsSummary | null; loading: boolean };

const INITIAL_SNAPSHOT: Snapshot = { data: null, loading: true };

function createNewsSummaryStore(endpoint: string) {
  let data: NewsSummary | null = null;
  let loading = true;
  let snapshot: Snapshot = INITIAL_SNAPSHOT;
  const listeners = new Set<() => void>();

  const notify = () => {
    snapshot = { data, loading };
    for (const listener of listeners) listener();
  };

  const load = async (force = false) => {
    loading = true;
    notify();

    try {
      const url = force ? `${endpoint}?force=true` : endpoint;
      const response = await apiFetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = (await response.json()) as NewsSummary;
    } catch (error) {
      console.error(`Failed to fetch from ${endpoint}:`, error);
      data = { summary: "News unavailable.", headlines: [], source: "headlines" };
    } finally {
      loading = false;
      notify();
    }
  };

  load();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): Snapshot {
      return snapshot;
    },
    refresh(force = false) {
      load(force);
    }
  };
}

const stores = new Map<string, ReturnType<typeof createNewsSummaryStore>>();

function getOrCreateStore(endpoint: string) {
  if (!stores.has(endpoint)) {
    stores.set(endpoint, createNewsSummaryStore(endpoint));
  }
  return stores.get(endpoint)!;
}

export { getOrCreateStore as getOrRefreshStore };

export function useNewsSummary(endpoint: string): Snapshot {
  const store = getOrCreateStore(endpoint);
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot(),
    () => INITIAL_SNAPSHOT
  );
}

export function useGlobalNews() {
  return useNewsSummary("/api/ai/news-summary");
}

export function useTechNews() {
  return useNewsSummary("/api/ai/tech-summary");
}

export function useScienceNews() {
  return useNewsSummary("/api/ai/science-summary");
}

export function refreshAllNews() {
  getOrCreateStore("/api/ai/news-summary").refresh(true);
  getOrCreateStore("/api/ai/tech-summary").refresh(true);
  getOrCreateStore("/api/ai/science-summary").refresh(true);
}
