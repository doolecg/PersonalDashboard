import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { CardDefinition } from "./types";

type CardAddMenuProps = {
  cards: CardDefinition[];
  onAddCard: (id: string) => void;
};

export function CardAddMenu({ cards, onAddCard }: CardAddMenuProps) {
  return (
    <div className="pointer-events-none absolute left-0 top-0 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Open widget menu"
            className="pointer-events-auto rounded-full border-cyan-300/35 bg-slate-950/78 text-cyan-50 shadow-2xl backdrop-blur-xl hover:bg-slate-900/88"
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Widgets
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-80 max-w-[calc(100vw-2rem)] border-white/10 bg-slate-950/92 p-2 text-white shadow-2xl backdrop-blur-xl"
          side="bottom"
          sideOffset={8}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100/72">
              Add widget
            </DropdownMenuLabel>
            {cards.length ? (
              cards.map((card) => (
                <DropdownMenuItem
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2.5 py-2 focus:bg-cyan-300/10 focus:text-white"
                  key={card.id}
                  onSelect={() => onAddCard(card.id)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-white/92">{card.title}</span>
                    {card.description ? <span className="block truncate text-[11px] text-white/52">{card.description}</span> : null}
                  </span>
                  <DropdownMenuShortcut className="ml-0 text-[11px] font-semibold tracking-normal text-white/50">
                    {card.footprint}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="rounded-xl px-2.5 py-2 text-xs text-white/58" disabled>
                All cards active
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
