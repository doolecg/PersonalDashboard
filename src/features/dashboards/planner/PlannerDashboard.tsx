import { CloudSun, Settings2 } from "lucide-react";
import { usePreferences } from "@/app/preferences/usePreferences";
import { useShellClock } from "@/app/shell/useShellClock";
import { useTickerTrack } from "@/app/shell/useTickerTrack";
import { useMediaQuery } from "@/app/useMediaQuery";
import { useWeatherData } from "@/features/cards/weather/useWeatherData";
import bgImage from "@/assets/bg.png";
import { AiChatCard } from "./AiChatCard";
import { LifeSummaryCard } from "./LifeSummaryCard";
import { PlannerCalendarCard } from "./PlannerCalendarCard";
import { StickyNotesCard } from "./StickyNotesCard";
import { TodoGlassCard } from "./TodoGlassCard";
import { WeatherTallCard } from "./WeatherTallCard";
import type { TickerItem } from "@/app/shell/types";
import type { CSSProperties } from "react";
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
  const range = typeof current.highC === "number" && typeof current.lowC === "number"
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

type PlannerDashboardProps = {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
};

export function PlannerDashboard({ onOpenSettings, userName, profileImage, tickerItems }: PlannerDashboardProps) {
  const preferences = usePreferences();
  const { timeText, dateText } = useShellClock(!preferences.clock24h);
  const initials = userName.trim().slice(0, 1).toUpperCase() || "A";
  const background = preferences.backgroundImage || bgImage;
  const track = useTickerTrack(tickerItems);
  const isPhone = useMediaQuery("(max-width: 720px)");

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

        {isPhone ? (
          // Phone: a single scrolling column with the AI summary first, and the
          // chat moved into a floating live-chat button (rendered below).
          <div className="body-mobile">
            <LifeSummaryCard />
            <WeatherTallCard />
            <PlannerCalendarCard />
            <TodoGlassCard />
            <StickyNotesCard />
          </div>
        ) : (
          <div className="body">
            <div className="col">
              <WeatherTallCard />
            </div>
            <div className="col">
              <AiChatCard />
            </div>
            <div className="col">
              <PlannerCalendarCard />
              <LifeSummaryCard />
            </div>
            <div className="col">
              <TodoGlassCard />
              <StickyNotesCard />
            </div>
          </div>
        )}

        {preferences.showTicker && tickerItems.length ? (
          <div className="ticker glass">
            <span className="ticker-tag">
              <span className="live-dot" /> Live
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

      {isPhone ? <AiChatCard variant="floating" /> : null}
    </div>
  );
}
