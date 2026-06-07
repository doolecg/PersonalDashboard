import { fetchJson } from "./fetchJson.js";

type MetNoApiResponse = {
  properties?: {
    timeseries?: Array<{
      time: string;
      data?: {
        instant?: {
          details?: Record<string, number | undefined>;
        };
        next_1_hours?: {
          summary?: {
            symbol_code?: string;
          };
          details?: Record<string, number | undefined>;
        };
      };
    }>;
  };
};

export async function fetchMetNoForecast(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude)
  });

  return fetchJson<MetNoApiResponse>(`https://api.met.no/weatherapi/locationforecast/2.0/compact?${params.toString()}`, {
    headers: {
      "User-Agent": "AuraWeather/0.1 (local dashboard)"
    }
  });
}
