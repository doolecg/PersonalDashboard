import { useCallback, useEffect, useState } from "react";
import { getAiStatus, setAiMode } from "../app/apiClient";
import type { AiRoutingMode, AiUsageSnapshot } from "../types/models";

export function useAiStatus() {
  const [status, setStatus] = useState<AiUsageSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getAiStatus());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI status unavailable");
    }
  }, []);

  const changeMode = useCallback(async (mode: AiRoutingMode) => {
    setStatus(await setAiMode(mode));
  }, []);

  const cycleMode = useCallback(async () => {
    if (!status) return;
    const index = status.availableModes.indexOf(status.mode);
    const next = status.availableModes[(index + 1) % status.availableModes.length];
    await changeMode(next);
  }, [changeMode, status]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 12_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { status, error, refresh, changeMode, cycleMode };
}
