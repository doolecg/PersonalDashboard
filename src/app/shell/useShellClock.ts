import { useEffect, useState } from "react";

function readClock(now: Date, hour12: boolean) {
  return {
    timeText: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12
    }).format(now),
    dateText: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(now)
  };
}

export function useShellClock(hour12 = true) {
  const [clock, setClock] = useState(() => readClock(new Date(), hour12));

  useEffect(() => {
    setClock(readClock(new Date(), hour12));

    const intervalId = window.setInterval(() => {
      setClock(readClock(new Date(), hour12));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hour12]);

  return clock;
}
