import { RefreshCw } from "lucide-react";
import type { TickerItem } from "@/app/shell/types";
import type { DashboardId } from "@/features/dashboards/dashboards";
import { PlannerShell } from "../planner/PlannerShell";
import { LifeSummaryCard } from "../planner/LifeSummaryCard";
import { NotificationsCard } from "../planner/NotificationsCard";
import { WeatherTallCard } from "../planner/WeatherTallCard";
import { GlobalNewsCard } from "./GlobalNewsCard";
import { TechNewsCard } from "./TechNewsCard";
import { ScienceNewsCard } from "./ScienceNewsCard";
import { TldrCoverageCard } from "./TldrCoverageCard";
import { refreshAllNews } from "./useNewsSummary";
import { useState } from "react";

export interface NewsDashboardProps {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
}

export function NewsDashboard(props: NewsDashboardProps) {
  const [spinKey, setSpinKey] = useState(0);

  function handleRefreshAll() {
    setSpinKey((k) => k + 1);
    refreshAllNews();
  }

  return (
    <PlannerShell
      {...props}
      extraHeaderAction={
        <button
          className="icon-btn glass"
          style={{ width: 38, height: 38 }}
          aria-label="Refresh all news"
          onClick={handleRefreshAll}
        >
          <RefreshCw size={15} key={spinKey} className="spinning" />
        </button>
      }
    >
      <div className="body">
        {/* Col 1: weather */}
        <div className="col">
          <WeatherTallCard />
        </div>

        {/* Col 2: your day + server log */}
        <div className="col">
          <LifeSummaryCard compact />
          <NotificationsCard />
        </div>

        {/* Cols 3-4: 2×2 news quad */}
        <div className="col news-quad-col" style={{ gridColumn: "span 2" }}>
          <div className="news-quad">
            <GlobalNewsCard />
            <TechNewsCard />
            <ScienceNewsCard />
            <TldrCoverageCard />
          </div>
        </div>
      </div>
    </PlannerShell>
  );
}
