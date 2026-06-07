import { useEffect, useState } from "react";
import { getShellConfig } from "./api";
import type { ShellConfig } from "./types";

const fallbackConfig: ShellConfig = { userName: "Aura", tickerItems: [] };

const refreshIntervalMs = 15 * 60 * 1000;

export function useShellConfig() {
  const [config, setConfig] = useState<ShellConfig>(fallbackConfig);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      getShellConfig()
        .then((nextConfig) => {
          if (!cancelled) setConfig(nextConfig);
        })
        .catch(() => {
          // keep the last good config (or fallback) on a failed refresh
        });
    };

    load();
    // Refresh the news/ticker items every 15 minutes.
    const intervalId = window.setInterval(load, refreshIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return config;
}
