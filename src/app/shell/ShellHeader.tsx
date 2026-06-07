import { Pencil, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShellHeaderProps = {
  isEditingCards: boolean;
  onToggleEditingCards: () => void;
  userName: string;
  timeText: string;
  dateText: string;
};

export function ShellHeader({ dateText, isEditingCards, onToggleEditingCards, timeText, userName }: ShellHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-3xl border border-border/95 bg-background/55 px-5 py-3 backdrop-blur-xl">
      <div className="min-w-0">
        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">User</p>
        <p className="truncate text-lg font-semibold text-foreground">{userName}</p>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-base font-semibold text-foreground">{timeText}</p>
          <p className="text-xs text-muted-foreground">{dateText}</p>
        </div>
        <Button
          aria-label={isEditingCards ? "Finish editing cards" : "Edit cards"}
          onClick={onToggleEditingCards}
          size="icon-sm"
          type="button"
          variant={isEditingCards ? "default" : "outline"}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <button
          type="button"
          aria-label="Open settings"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-foreground transition hover:bg-accent/70"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
