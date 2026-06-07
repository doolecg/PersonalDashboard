export type WeatherSourceId = "open-meteo-ukmo" | "metno" | "open-meteo-icon";

export type WeatherPoint = {
  time: string;
  temperatureC?: number;
  apparentTemperatureC?: number;
  precipitationMm?: number;
  precipitationProbability?: number;
  windSpeedKmh?: number;
  windDirectionDeg?: number;
  windGustKmh?: number;
  humidityPercent?: number;
  pressureHpa?: number;
  visibilityKm?: number;
  cloudCoverPercent?: number;
  uvIndex?: number;
  weatherCode?: number | string;
};

export type WeatherDailyPoint = {
  date: string;
  highC?: number;
  lowC?: number;
  precipitationMm?: number;
  precipitationProbability?: number;
  windSpeedKmh?: number;
  sunrise?: string;
  sunset?: string;
  weatherCode?: number | string;
};

export type NormalizedWeatherSource = {
  source: WeatherSourceId;
  fetchedAt: string;
  location: {
    city: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  };
  current: WeatherPoint;
  hourly: WeatherPoint[];
  daily: WeatherDailyPoint[];
};

export type EnsembleWeather = {
  location: NormalizedWeatherSource["location"];
  updatedAt: string;
  sourcesUsed: WeatherSourceId[];
  current: WeatherPoint;
  hourly: WeatherPoint[];
  daily: WeatherDailyPoint[];
};

export type WeatherWidgetPayload = {
  current: {
    location: string;
    temperatureC: number;
    feelsLikeC?: number;
    conditionLabel: string;
    conditionCode: string;
    highC?: number;
    lowC?: number;
    summary: string;
  };
  precipitation: {
    summary: string;
    points: Array<{
      time: string;
      label: string;
      precipitationMm: number;
      probability: number;
      intensity: number;
    }>;
  };
  hourly: Array<{
    time: string;
    label: string;
    temperatureC?: number;
    probability?: number;
    conditionCode: string;
  }>;
  daily: Array<{
    date: string;
    label: string;
    highC?: number;
    lowC?: number;
    probability?: number;
    conditionCode: string;
  }>;
  details: {
    humidityPercent?: number;
    windKmh?: number;
    windDirectionLabel?: string;
    pressureHpa?: number;
    visibilityKm?: number;
    uvIndex?: number;
    sunrise?: string;
    sunset?: string;
  };
  meta: {
    updatedAt: string;
    sourcesUsed: WeatherSourceId[];
  };
};
