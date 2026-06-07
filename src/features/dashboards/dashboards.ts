export type DashboardId = "home" | "planner";

export const dashboardIds: readonly DashboardId[] = ["home", "planner"];

export const dashboardLabels: Record<DashboardId, string> = {
  home: "Home",
  planner: "Planner"
};

export function isDashboardId(value: unknown): value is DashboardId {
  return value === "home" || value === "planner";
}
