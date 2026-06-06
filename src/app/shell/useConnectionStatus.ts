import { useEffect, useState } from "react";
import { getHealthStatus } from "./api";
import { getConnectionState } from "./shellUi";

const POLL_MS = 15000;

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      void getHealthStatus()
        .then((ok) => {
          if (!cancelled) setIsOnline(ok);
        })
        .catch(() => {
          if (!cancelled) setIsOnline(false);
        });
    };

    check();
    const intervalId = window.setInterval(check, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return getConnectionState(isOnline);
}
