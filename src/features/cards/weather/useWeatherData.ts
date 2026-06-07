import { startTransition, useEffect, useState } from "react";
import { getDashboardLocationKey, type DashboardLocation } from "@/app/preferences/preferences";
import { usePreferences } from "@/app/preferences/usePreferences";
import { getWeatherData } from "@/app/apiClient";
import type { WeatherWidgetPayload } from "./types";

type WeatherState = {
  data: WeatherWidgetPayload | null;
  error: string | null;
  loading: boolean;
};

const weatherStore: WeatherState & {
  locationKey: string;
  promise: Promise<void> | null;
  listeners: Set<() => void>;
} = {
  data: null,
  error: null,
  locationKey: "default",
  loading: true,
  promise: null,
  listeners: new Set()
};

function emitWeatherChange() {
  weatherStore.listeners.forEach((listener) => listener());
}

function getSnapshot(locationKey: string): WeatherState {
  if (weatherStore.locationKey !== locationKey) {
    return { data: null, error: null, loading: true };
  }

  return {
    data: weatherStore.data,
    error: weatherStore.error,
    loading: weatherStore.loading
  };
}

async function loadWeather(location: DashboardLocation | null) {
  const locationKey = getDashboardLocationKey(location);

  if (!weatherStore.promise || weatherStore.locationKey !== locationKey) {
    weatherStore.locationKey = locationKey;
    weatherStore.loading = true;
    weatherStore.error = null;
    emitWeatherChange();

    let request: Promise<void>;
    request = getWeatherData(location)
      .then((data) => {
        if (weatherStore.promise !== request || weatherStore.locationKey !== locationKey) return;
        weatherStore.data = data;
        weatherStore.error = null;
      })
      .catch((error: unknown) => {
        if (weatherStore.promise !== request || weatherStore.locationKey !== locationKey) return;
        weatherStore.error = error instanceof Error ? error.message : "Unable to load weather";
      })
      .finally(() => {
        if (weatherStore.promise !== request || weatherStore.locationKey !== locationKey) return;
        weatherStore.loading = false;
        weatherStore.promise = null;
        emitWeatherChange();
      });

    weatherStore.promise = request;
  }

  return weatherStore.promise;
}

export function useWeatherData() {
  const { location } = usePreferences();
  const locationKey = getDashboardLocationKey(location);
  const [state, setState] = useState<WeatherState>(() => getSnapshot(locationKey));

  useEffect(() => {
    const syncState = () => {
      startTransition(() => {
        setState(getSnapshot(locationKey));
      });
    };

    weatherStore.listeners.add(syncState);
    syncState();
    void loadWeather(location);

    return () => {
      weatherStore.listeners.delete(syncState);
    };
  }, [location, locationKey]);

  return {
    ...state,
    refresh: async () => {
      weatherStore.promise = null;
      await loadWeather(location);
    }
  };
}
