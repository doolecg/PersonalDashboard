import { useEffect, useState } from "react";
import { getDashboardLocationKey, type DashboardLocation } from "@/app/preferences/preferences";
import { usePreferences } from "@/app/preferences/usePreferences";
import { getWeatherReport } from "@/app/apiClient";
import type { WeatherReport } from "./types";

type ReportState = {
  data: WeatherReport | null;
  error: string | null;
  loading: boolean;
};

// One shared fetch for both the AI report and insight cards, mirroring the
// useWeatherData store so the report endpoint is only hit once per page.
const reportStore: ReportState & { locationKey: string; promise: Promise<void> | null; listeners: Set<() => void> } = {
  data: null,
  error: null,
  locationKey: "default",
  loading: true,
  promise: null,
  listeners: new Set(),
};

function emit() {
  reportStore.listeners.forEach((listener) => listener());
}

function getSnapshot(locationKey: string): ReportState {
  if (reportStore.locationKey !== locationKey) {
    return { data: null, error: null, loading: true };
  }

  return {
    data: reportStore.data,
    error: reportStore.error,
    loading: reportStore.loading,
  };
}

function loadReport(location: DashboardLocation | null) {
  const locationKey = getDashboardLocationKey(location);

  if (!reportStore.promise || reportStore.locationKey !== locationKey) {
    reportStore.locationKey = locationKey;
    reportStore.loading = true;
    reportStore.error = null;
    emit();

    let request: Promise<void>;
    request = getWeatherReport(location)
      .then((data) => {
        if (reportStore.promise !== request || reportStore.locationKey !== locationKey) return;
        reportStore.data = data;
        reportStore.error = null;
      })
      .catch((error: unknown) => {
        if (reportStore.promise !== request || reportStore.locationKey !== locationKey) return;
        reportStore.error = error instanceof Error ? error.message : "Unable to load weather report";
      })
      .finally(() => {
        if (reportStore.promise !== request || reportStore.locationKey !== locationKey) return;
        reportStore.loading = false;
        reportStore.promise = null;
        emit();
      });

    reportStore.promise = request;
  }
  return reportStore.promise;
}

export function useWeatherReport() {
  const { location } = usePreferences();
  const locationKey = getDashboardLocationKey(location);
  const [state, setState] = useState<ReportState>(() => getSnapshot(locationKey));

  useEffect(() => {
    const sync = () => setState(getSnapshot(locationKey));

    reportStore.listeners.add(sync);
    sync();
    void loadReport(location);
    return () => {
      reportStore.listeners.delete(sync);
    };
  }, [location, locationKey]);

  return state;
}
