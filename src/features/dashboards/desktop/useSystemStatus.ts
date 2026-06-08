import { useSyncExternalStore } from "react";
import type { SystemStatus } from "@/types/models";

type Snapshot = { data: SystemStatus | null; loading: boolean };

const INITIAL_SNAPSHOT: Snapshot = { data: null, loading: true };
const POLL_MS = 15000;

let data: SystemStatus | null = null;
let loading = true;
let snapshot: Snapshot = INITIAL_SNAPSHOT;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notify() {
  snapshot = { data, loading };
  for (const listener of listeners) listener();
}

async function load() {
  try {
    const response = await fetch("/api/system/status");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = (await response.json()) as SystemStatus;
  } catch {
    // keep last known data; just clear the loading flag
  } finally {
    loading = false;
    notify();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    load();
    timer = setInterval(load, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useSystemStatus(): Snapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => INITIAL_SNAPSHOT);
}
