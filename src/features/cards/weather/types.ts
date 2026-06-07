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
    sourcesUsed: string[];
  };
};
