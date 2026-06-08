import type { TickerItem } from "@/app/shell/types";
import type { DashboardId } from "@/features/dashboards/dashboards";
import { PlannerShell } from "../planner/PlannerShell";
import { WeatherTallCard } from "../planner/WeatherTallCard";
import { PlannerCalendarCard } from "../planner/PlannerCalendarCard";
import { TodoGlassCard } from "../planner/TodoGlassCard";
import { StickyNotesCard } from "../planner/StickyNotesCard";

export interface ProductivityDashboardProps {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
}

export function ProductivityDashboard(props: ProductivityDashboardProps) {
  return (
    <PlannerShell {...props}>
      <div className="body">
        <div className="col">
          <WeatherTallCard />
        </div>
        <div className="col">
          <PlannerCalendarCard />
        </div>
        <div className="col">
          <TodoGlassCard />
        </div>
        <div className="col">
          <StickyNotesCard />
        </div>
      </div>
    </PlannerShell>
  );
}
