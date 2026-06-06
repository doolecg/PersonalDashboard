import { useEffect, useState } from "react";

function readClock(now: Date) {
  return {
    timeText: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    }).format(now),
    dateText: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(now)
  };
}

export function useShellClock() {
  const [clock, setClock] = useState(() => readClock(new Date()));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(readClock(new Date()));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return clock;
}
