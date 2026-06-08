import { type CSSProperties } from "react";
import { Pencil, Settings2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardIds, dashboardLabels, type DashboardId } from "@/features/dashboards/dashboards";
import { useTickerTrack } from "./useTickerTrack";
import type { ConnectionState, TickerItem } from "./types";

const shellTickerDurationSeconds = 2000;

const footerButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-foreground transition hover:bg-accent/70";

type ShellFooterProps = {
  tickerItems: TickerItem[];
  connection: ConnectionState;
  showTicker?: boolean;
  userName: string;
  profileImage: string;
  timeText: string;
  dateText: string;
  isEditingCards: boolean;
  canEdit: boolean;
  onToggleEditingCards: () => void;
  onOpenSettings: () => void;
  activeDashboard: DashboardId;
  onSelectDashboard: (dashboard: DashboardId) => void;
};

export function ShellFooter({
  tickerItems,
  connection,
  showTicker = true,
  userName,
  profileImage,
  timeText,
  dateText,
  isEditingCards,
  canEdit,
  onToggleEditingCards,
  onOpenSettings,
  activeDashboard,
  onSelectDashboard,
}: ShellFooterProps) {
  const trackItems = useTickerTrack(tickerItems);

  return (
    <footer className="mx-auto flex w-full max-w-6xl items-center gap-5 overflow-hidden rounded-[26px] border border-white/[0.16] bg-[linear-gradient(157deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.015)_100%),linear-gradient(157deg,rgba(74,80,124,0.42)_0%,rgba(34,38,70,0.52)_100%)] px-4 py-2.5 shadow-[0_20px_54px_rgba(6,8,28,0.4),inset_0_1px_0_rgba(255,255,255,0.28)]">
      <div className="flex shrink-0 items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-background/70 text-muted-foreground">
          {profileImage ? (
            <img src={profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">Aura</p>
          <p className="truncate text-lg font-semibold text-foreground">{userName}</p>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-background/70 p-1">
          {dashboardIds.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={activeDashboard === id}
              onClick={() => onSelectDashboard(id)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                activeDashboard === id && "bg-primary text-primary-foreground hover:text-primary-foreground",
              )}
            >
              {dashboardLabels[id]}
            </button>
          ))}
        </div>
        {canEdit ? (
          <button
            aria-label={isEditingCards ? "Finish editing cards" : "Edit cards"}
            aria-pressed={isEditingCards}
            onClick={onToggleEditingCards}
            type="button"
            className={cn(
              footerButtonClassName,
              isEditingCards && "border-primary/60 bg-primary text-primary-foreground hover:bg-primary/80",
            )}
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Open settings"
          onClick={onOpenSettings}
          className={footerButtonClassName}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        {showTicker ? (
        <div
          className="shell-ticker-track flex min-w-max items-center gap-24 pr-24"
          style={{ "--shell-ticker-duration": `${shellTickerDurationSeconds}s` } as CSSProperties}
        >
          {trackItems.map((item, index) => item.url ? (
            <a
              className="text-sm whitespace-nowrap text-muted-foreground transition hover:text-foreground"
              href={item.url}
              key={`${item.source}-${item.title}-${index}`}
              rel="noreferrer"
              target="_blank"
            >
              <span className="font-medium text-foreground/90">{item.source}</span>
              <span className="px-2 text-muted-foreground/70">&middot;</span>
              <span>{item.title}</span>
            </a>
          ) : (
            <span className="text-sm whitespace-nowrap text-muted-foreground" key={`${item.source}-${item.title}-${index}`}>
              <span className="font-medium text-foreground/90">{item.source}</span>
              <span className="px-2 text-muted-foreground/70">&middot;</span>
              <span>{item.title}</span>
            </span>
          ))}
        </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-base font-semibold text-foreground">{timeText}</p>
          <p className="text-xs text-muted-foreground">{dateText}</p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
            connection.tone === "online"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/40 bg-rose-500/10 text-rose-200"
          )}
        >
          {connection.label}
        </div>
      </div>
    </footer>
  );
}
