import { useEffect, useState } from "react";
import { getShellConfig } from "./api";
import type { ShellConfig } from "./types";

const fallbackConfig: ShellConfig = { userName: "User", tickerItems: [] };

export function useShellConfig() {
  const [config, setConfig] = useState<ShellConfig>(fallbackConfig);

  useEffect(() => {
    let cancelled = false;

    getShellConfig()
      .then((nextConfig) => {
        if (!cancelled) setConfig(nextConfig);
      })
      .catch(() => {
        if (!cancelled) setConfig(fallbackConfig);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
