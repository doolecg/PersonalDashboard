import { startTransition, useEffect, useState } from "react";
import { getWeatherData } from "@/app/apiClient";
import type { WeatherWidgetPayload } from "./types";

type WeatherState = {
  data: WeatherWidgetPayload | null;
  error: string | null;
  loading: boolean;
};

const weatherStore: WeatherState & {
  promise: Promise<void> | null;
  listeners: Set<() => void>;
} = {
  data: null,
  error: null,
  loading: true,
  promise: null,
  listeners: new Set()
};

function emitWeatherChange() {
  weatherStore.listeners.forEach((listener) => listener());
}

async function loadWeather() {
  if (!weatherStore.promise) {
    weatherStore.loading = true;
    weatherStore.promise = getWeatherData()
      .then((data) => {
        weatherStore.data = data;
        weatherStore.error = null;
      })
      .catch((error: unknown) => {
        weatherStore.error = error instanceof Error ? error.message : "Unable to load weather";
      })
      .finally(() => {
        weatherStore.loading = false;
        weatherStore.promise = null;
        emitWeatherChange();
      });
  }

  return weatherStore.promise;
}

export function useWeatherData() {
  const [state, setState] = useState<WeatherState>({
    data: weatherStore.data,
    error: weatherStore.error,
    loading: weatherStore.loading
  });

  useEffect(() => {
    const syncState = () => {
      startTransition(() => {
        setState({
          data: weatherStore.data,
          error: weatherStore.error,
          loading: weatherStore.loading
        });
      });
    };

    weatherStore.listeners.add(syncState);
    void loadWeather();

    return () => {
      weatherStore.listeners.delete(syncState);
    };
  }, []);

  return {
    ...state,
    refresh: async () => {
      weatherStore.promise = null;
      await loadWeather();
    }
  };
}
