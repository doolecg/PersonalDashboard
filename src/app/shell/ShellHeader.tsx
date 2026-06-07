import { Pencil, Settings2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const headerButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-foreground transition hover:bg-accent/70";

type ShellHeaderProps = {
  isEditingCards: boolean;
  onToggleEditingCards: () => void;
  onOpenSettings: () => void;
  userName: string;
  profileImage: string;
  timeText: string;
  dateText: string;
};

export function ShellHeader({ dateText, isEditingCards, onToggleEditingCards, onOpenSettings, profileImage, timeText, userName }: ShellHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-3xl border border-border/95 bg-background/55 px-5 py-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
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
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-base font-semibold text-foreground">{timeText}</p>
          <p className="text-xs text-muted-foreground">{dateText}</p>
        </div>
        <button
          aria-label={isEditingCards ? "Finish editing cards" : "Edit cards"}
          aria-pressed={isEditingCards}
          onClick={onToggleEditingCards}
          type="button"
          className={cn(
            headerButtonClassName,
            isEditingCards && "border-primary/60 bg-primary text-primary-foreground hover:bg-primary/80",
          )}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Open settings"
          onClick={onOpenSettings}
          className={headerButtonClassName}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
