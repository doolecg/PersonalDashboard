import type { DashboardId } from "@/features/dashboards/dashboards";

export type DashboardLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export type DashboardPreferences = {
  displayName: string;
  profileImage: string;
  backgroundImage: string;
  clock24h: boolean;
  showBackground: boolean;
  showTicker: boolean;
  location: DashboardLocation | null;
  defaultDashboard: DashboardId;
};

export const defaultPreferences: DashboardPreferences = {
  displayName: "",
  profileImage: "",
  backgroundImage: "",
  clock24h: true,
  showBackground: true,
  showTicker: true,
  location: null,
  defaultDashboard: "home"
};

export function getDashboardLocationKey(location: DashboardLocation | null): string {
  if (!location) return "default";
  return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}:${location.name}`;
}

const storageKey = "dashboard-preferences";

function readStoredPreferences(): DashboardPreferences {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
    return { ...defaultPreferences, ...parsed };
  } catch {
    return defaultPreferences;
  }
}

let preferences: DashboardPreferences =
  typeof window === "undefined" ? defaultPreferences : readStoredPreferences();

const listeners = new Set<() => void>();

function persist() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // ignore storage access errors
  }
}

export function getPreferences(): DashboardPreferences {
  return preferences;
}

export function setPreference<K extends keyof DashboardPreferences>(
  key: K,
  value: DashboardPreferences[K],
): void {
  if (preferences[key] === value) return;
  preferences = { ...preferences, [key]: value };
  persist();
  for (const listener of listeners) listener();
}

export function subscribePreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
