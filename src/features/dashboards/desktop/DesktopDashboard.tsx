import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
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

// Leave room at the bottom so snapped/maximized windows don't hide under the dock.
const DOCK_RESERVE = 56;

export function DesktopDashboard(props: DesktopDashboardProps) {
  const { layout, order, move, resize, snap, toggle, focus, reset } = useDesktopLayout();
  const areaRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const update = () => setBounds({ w: el.clientWidth, h: Math.max(0, el.clientHeight - DOCK_RESERVE) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

        {/* Dock / taskbar: toggle panels + reset layout */}
        <div className="desk-dock glass">
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              className={`desk-dock-item${layout[panel.id]?.visible ? " active" : ""}`}
              onClick={() => {
                if (!layout[panel.id]?.visible) focus(panel.id);
                toggle(panel.id);
              }}
              title={`${layout[panel.id]?.visible ? "Hide" : "Show"} ${panel.title}`}
            >
              {panel.icon}
              <span>{panel.title}</span>
            </button>
          ))}
          <span className="desk-dock-sep" />
          <button type="button" className="desk-dock-item" onClick={reset} title="Reset layout">
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </PlannerShell>
  );
}
