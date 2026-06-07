import { GripVertical, Scaling, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { motionConstants } from "@/constants";
import { cn } from "@/lib/utils";
import type { CardFootprint } from "./types";

type CardEditChromeProps = {
  allowedFootprints: readonly CardFootprint[];
  cardId: string;
  children: ReactNode;
  footprint: CardFootprint;
  isDragging: boolean;
  isEditing: boolean;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDragStart: (cardId: string) => void;
  onRemove: () => void;
  onResize: (footprint: CardFootprint) => void;
};

export function CardEditChrome({
  allowedFootprints,
  cardId,
  children,
  footprint,
  isDragging,
  isEditing,
  onDragEnd,
  onDragEnter,
  onRemove,
  onDragStart,
  onResize
}: CardEditChromeProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nextFootprints = useMemo(() => allowedFootprints.filter((option) => option !== footprint), [allowedFootprints, footprint]);

  return (
    <div
      className={cn(
        "relative h-full min-h-0 transition-transform duration-200",
        isEditing && motionConstants.jiggleClassName,
        isDragging && "scale-[0.98] opacity-85"
      )}
      onDragEnter={() => {
        if (isEditing) {
          onDragEnter();
        }
      }}
      onDragOver={(event) => {
        if (isEditing) {
          event.preventDefault();
        }
      }}
    >
      {isEditing ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-2.5 pt-2.5">
          <Button
            aria-label="Move card"
            className="pointer-events-auto rounded-full border-white/15 bg-slate-950/70 text-white/88 shadow-lg backdrop-blur-md"
            draggable
            onDragEnd={onDragEnd}
            onDragStart={() => onDragStart(cardId)}
            size="icon-xs"
            type="button"
            variant="outline"
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          <div className="pointer-events-auto flex items-start gap-1">
            <Button
              aria-label="Remove card"
              className="rounded-full border-white/15 bg-slate-950/70 text-white/88 shadow-lg backdrop-blur-md"
              onClick={onRemove}
              size="icon-xs"
              type="button"
              variant="outline"
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="relative">
              <Button
                aria-expanded={isMenuOpen}
                aria-label="Resize card"
                className="rounded-full border-white/15 bg-slate-950/70 text-white/88 shadow-lg backdrop-blur-md"
                onClick={() => setIsMenuOpen((open) => !open)}
                size="icon-xs"
                type="button"
                variant="outline"
              >
                <Scaling className="h-3 w-3" />
              </Button>
              {isMenuOpen && nextFootprints.length > 0 ? (
                <div className="absolute right-0 top-8 flex min-w-24 flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/88 p-1.5 shadow-2xl backdrop-blur-xl">
                  {nextFootprints.map((option) => (
                    <Button
                      className="justify-start rounded-xl text-white/90"
                      key={option}
                      onClick={() => {
                        onResize(option);
                        setIsMenuOpen(false);
                      }}
                      size="xs"
                      type="button"
                      variant="ghost"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
