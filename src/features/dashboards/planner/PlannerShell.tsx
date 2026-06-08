import { CloudSun, Settings2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { usePreferences } from "@/app/preferences/usePreferences";
import { useShellClock } from "@/app/shell/useShellClock";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useTickerTrack } from "@/app/shell/useTickerTrack";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import bgImage from "@/assets/bg.png";
import { dashboardIds, dashboardLabels, type DashboardId } from "@/features/dashboards/dashboards";
import type { TickerItem } from "@/app/shell/types";
import { AiChatCard } from "./AiChatCard";
import "./planner.css";

function greeting(name: string) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

function WeatherPill() {
  const { data } = useWeatherData();
  if (!data) return null;
  const { current } = data;
  const range =
    typeof current.highC === "number" && typeof current.lowC === "number"
      ? `H${Math.round(current.highC)}° L${Math.round(current.lowC)}°`
      : current.conditionLabel;
  return (
    <div className="h-pill glass">
      <CloudSun size={20} />
      <span className="hp-temp">{Math.round(current.temperatureC)}°</span>
      <span className="hp-meta">
        {current.location}
        <br />
        {range}
      </span>
    </div>
  );
}

type PlannerShellProps = {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
  children: ReactNode;
};

export function PlannerShell({
  onOpenSettings,
  userName,
  profileImage,
  tickerItems,
  activeDashboard,
  onSelectDashboard,
  children
}: PlannerShellProps) {
  const preferences = usePreferences();
  const { timeText, dateText } = useShellClock(!preferences.clock24h);
  const connection = useConnectionStatus();
  const online = connection.tone === "online";
  const initials = userName.trim().slice(0, 1).toUpperCase() || "A";
  const background = preferences.backgroundImage || bgImage;
  const track = useTickerTrack(tickerItems);

  return (
    <div className="planner">
      <div className="planner-bg">
        {preferences.showBackground ? (
          <div className="planner-bg-img" style={{ backgroundImage: `url(${background})` }} />
        ) : null}
        <div className="planner-bg-tint" />
      </div>

      <div className="layout">
        <header className="hdr">
          <div className="hdr-l">
            <div className="hdr-greet">{greeting(userName)}</div>
            <div className="tabs glass">
              {dashboardIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`tab${activeDashboard === id ? " active" : ""}`}
                  aria-pressed={activeDashboard === id}
                  onClick={() => onSelectDashboard(id)}
                >
                  {dashboardLabels[id]}
                </button>
              ))}
            </div>
          </div>
          <div className="hdr-r">
            <WeatherPill />
            <div className="hdr-time">
              <div className="t">{timeText}</div>
              <div className="d">{dateText}</div>
            </div>
            <button type="button" className="icon-btn glass" aria-label="Open settings" onClick={onOpenSettings}>
              <Settings2 size={18} />
            </button>
            <span className="h-ava">{profileImage ? <img src={profileImage} alt="" /> : initials}</span>
          </div>
        </header>

        {children}

        {/* Floating AI chat — always visible as a corner FAB on every dashboard */}
        <AiChatCard variant="floating" />

        {preferences.showTicker && tickerItems.length ? (
          <div className="ticker glass">
            <span
              className="ticker-tag"
              style={online ? undefined : { background: "rgba(255,69,58,0.85)" }}
              title={online ? "Server connected" : "Server unreachable"}
            >
              <span className="live-dot" style={online ? undefined : { animation: "none" }} />
              {online ? "LIVE" : "OFFLINE"}
            </span>
            <div className="ticker-feed">
              <div className="shell-ticker-track" style={{ "--shell-ticker-duration": "2000s" } as CSSProperties}>
                {track.map((item, index) => (
                  <span className="ticker-item" key={`${item.source}-${index}`}>
                    <span className="ti-src">{item.source}</span>
                    <span className="ti-txt">{item.title}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
