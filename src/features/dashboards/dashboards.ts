export type DashboardId = "news" | "weather" | "productivity" | "desktop";

export const dashboardIds: readonly DashboardId[] = ["news", "weather", "productivity", "desktop"];

export const dashboardLabels: Record<DashboardId, string> = {
  news: "News",
  weather: "Weather",
  productivity: "Productivity",
  desktop: "Desktop"
};

export function isDashboardId(value: unknown): value is DashboardId {
  return value === "news" || value === "weather" || value === "productivity" || value === "desktop";
}
