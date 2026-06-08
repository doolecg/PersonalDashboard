import type { TickerItem } from "@/app/shell/types";
import type { DashboardId } from "@/features/dashboards/dashboards";
import { PlannerShell } from "../planner/PlannerShell";
import { WeatherTallCard } from "../planner/WeatherTallCard";
import { LifeSummaryCard } from "../planner/LifeSummaryCard";
import { NewsSummaryCard } from "./NewsSummaryCard";

export interface NewsDashboardProps {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
}

export function NewsDashboard(props: NewsDashboardProps) {
  return (
    <PlannerShell {...props}>
      <div className="body">
        <div className="col">
          <WeatherTallCard />
        </div>
        <div className="col">
          <LifeSummaryCard />
        </div>
        <div className="col" style={{ gridColumn: "span 2" }}>
          <NewsSummaryCard />
        </div>
      </div>
    </PlannerShell>
  );
}
