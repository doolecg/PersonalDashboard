import { useEffect, useRef, useState } from "react";
import { LayoutGrid, RotateCcw, X } from "lucide-react";
import type { TickerItem } from "@/app/shell/types";
import type { DashboardId } from "@/features/dashboards/dashboards";
import { PlannerShell } from "../planner/PlannerShell";
import { DesktopWindow } from "./DesktopWindow";
import { PANELS } from "./panels";
import { useDesktopLayout } from "./useDesktopLayout";

export interface DesktopDashboardProps {
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  tickerItems: TickerItem[];
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
}

const DOCK_RESERVE = 56;

export function DesktopDashboard(props: DesktopDashboardProps) {
  const { layout, order, move, resize, snap, toggle, focus, reset } = useDesktopLayout();
  const areaRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });
  const [launcherOpen, setLauncherOpen] = useState(false);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => setBounds({ w: el.clientWidth, h: Math.max(0, el.clientHeight - DOCK_RESERVE) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Close launcher when clicking outside
  useEffect(() => {
    if (!launcherOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".desk-launcher") && !target.closest(".desk-start-btn")) {
        setLauncherOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [launcherOpen]);

  const launcherPanel = launcherOpen ? (
    <div className="desk-launcher glass">
      <div className="desk-launcher-grid">
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className={`desk-launcher-item${layout[panel.id]?.visible ? " active" : ""}`}
            onClick={() => {
              if (!layout[panel.id]?.visible) focus(panel.id);
              toggle(panel.id);
            }}
            title={`${layout[panel.id]?.visible ? "Hide" : "Show"} ${panel.title}`}
          >
            <span className="desk-launcher-icon">{panel.icon}</span>
            <span className="desk-launcher-label">{panel.title}</span>
          </button>
        ))}
      </div>
      <div className="desk-launcher-sep" />
      <button type="button" className="desk-launcher-reset" onClick={() => { reset(); setLauncherOpen(false); }}>
        <RotateCcw size={13} />
        Reset layout
      </button>
    </div>
  ) : null;

  return (
    <PlannerShell {...props}>
      <div className="desk-area" ref={areaRef}>
        {PANELS.map((panel) => {
          const state = layout[panel.id];
          if (!state?.visible) return null;
          const zIndex = order.indexOf(panel.id) + 1;
          const { Body } = panel;
          return (
            <DesktopWindow
              key={panel.id}
              title={panel.title}
              icon={panel.icon}
              state={state}
              zIndex={zIndex}
              bounds={bounds}
              onMove={(x, y) => move(panel.id, x, y)}
              onResize={(w, h) => resize(panel.id, w, h)}
              onSnap={(rect) => snap(panel.id, rect)}
              onClose={() => toggle(panel.id)}
              onFocus={() => focus(panel.id)}
            >
              <Body />
            </DesktopWindow>
          );
        })}

        {/* Desktop dock — single "Start" button */}
        <div className="desk-dock glass">
          {launcherPanel}
          <button
            type="button"
            className={`desk-start-btn${launcherOpen ? " active" : ""}`}
            onClick={() => setLauncherOpen((v) => !v)}
            aria-label={launcherOpen ? "Close launcher" : "Open launcher"}
            aria-expanded={launcherOpen}
          >
            {launcherOpen ? <X size={16} /> : <LayoutGrid size={16} />}
            <span>Apps</span>
          </button>
        </div>
      </div>

      {/* Mobile launcher FAB — outside desk-area so fixed positioning works correctly */}
      {launcherOpen && (
        <div className="desk-mob-menu glass">
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              className={`desk-mob-item${layout[panel.id]?.visible ? " active" : ""}`}
              onClick={() => {
                if (!layout[panel.id]?.visible) focus(panel.id);
                toggle(panel.id);
              }}
            >
              {panel.icon}
              <span>{panel.title}</span>
            </button>
          ))}
          <div className="desk-mob-sep" />
          <button type="button" className="desk-mob-item" onClick={() => { reset(); setLauncherOpen(false); }}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      )}
      <button
        type="button"
        className="desk-mob-fab"
        aria-label={launcherOpen ? "Close launcher" : "Open launcher"}
        onClick={() => setLauncherOpen((v) => !v)}
      >
        {launcherOpen ? <X size={20} /> : <LayoutGrid size={20} />}
      </button>
    </PlannerShell>
  );
}
