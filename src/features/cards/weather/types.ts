export type WeatherWarning = {
  message: string;
  severity: "yellow" | "amber" | "red";
  type: string;
};

export type WeatherWidgetPayload = {
  current: {
    location: string;
    latitude?: number;
    longitude?: number;
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
    precipitationMm?: number;
    probability?: number;
    windKmh?: number;
    windDirectionDeg?: number;
    cloudCoverPercent?: number;
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
    windDirectionDeg?: number;
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
  warnings: WeatherWarning[];
};

export type WeatherReport = {
  report: string;
  insight: string;
  source: "openai" | "generated";
};
