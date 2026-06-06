import { cn } from "@/lib/utils";
import { buildTickerTrack } from "./shellUi";
import type { ConnectionState } from "./types";

type ShellFooterProps = {
  tickerItems: string[];
  connection: ConnectionState;
};

export function ShellFooter({ tickerItems, connection }: ShellFooterProps) {
  const trackItems = buildTickerTrack(tickerItems);

  return (
    <footer className="flex items-center gap-4 overflow-hidden rounded-3xl border border-border/60 bg-background/55 px-4 py-3 backdrop-blur-xl">
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="shell-ticker-track flex min-w-max items-center gap-8 pr-8">
          {trackItems.map((item, index) => (
            <span className="text-sm whitespace-nowrap text-muted-foreground" key={`${item}-${index}`}>
              {item}
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
