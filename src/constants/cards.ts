import type { CardFootprint } from "@/features/cards/types";

type CardBehavior = {
  allowedFootprints: readonly CardFootprint[];
  defaultVisibleDays?: number;
  defaultVisibleHours?: number;
};

export const cardBehaviorConstants: Record<string, CardBehavior> = {
  "calendar-month": { allowedFootprints: ["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"] },
  "calendar-upcoming": { allowedFootprints: ["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"] },
  "calendar-planner": { allowedFootprints: ["1x1", "1x2", "2x1", "2x2", "4x2", "4x4"] },
  "weather-current": { allowedFootprints: ["1x1", "2x1", "2x2"] },
  "weather-ai-report": { allowedFootprints: ["2x1", "1x2", "2x2", "4x2"] },
  "weather-precipitation": { allowedFootprints: ["1x1", "2x1", "2x2", "4x4"] },
  "weather-insight": { allowedFootprints: ["2x1", "4x2"] },
  "weather-hourly": { allowedFootprints: ["2x1", "2x2", "4x2"], defaultVisibleHours: 12 },
  "weather-ten-day": { allowedFootprints: ["1x1", "2x1", "2x2", "4x2"], defaultVisibleDays: 4 },
  "weather-map": { allowedFootprints: ["2x1", "2x2", "4x2", "4x4"] },
  "weather-details": { allowedFootprints: ["1x1", "2x1"] }
};
