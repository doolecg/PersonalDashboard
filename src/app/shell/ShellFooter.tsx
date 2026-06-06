import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { buildTickerTrack } from "./shellUi";
import type { ConnectionState, TickerItem } from "./types";

const shellTickerDurationSeconds = 800;

type ShellFooterProps = {
  tickerItems: TickerItem[];
  connection: ConnectionState;
};

export function ShellFooter({ tickerItems, connection }: ShellFooterProps) {
  const trackItems = buildTickerTrack(tickerItems);

  return (
    <footer className="mx-auto w-4/5 flex items-center gap-4 overflow-hidden rounded-3xl border border-border/60 bg-background/55 px-4 py-3 backdrop-blur-xl">
      <div className="relative min-w-0 flex-1 overflow-hidden">
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
    </footer>
  );
}
