import { cn } from "@/lib/utils";

export type ActiveGridSlot = {
  column: number;
  row: number;
};

type CardDragStateClassNamesOptions = {
  isActiveSlot: boolean;
  isDragged: boolean;
};

export function isActiveGridSlot(activeSlot: ActiveGridSlot | null, column: number, row: number) {
  return activeSlot?.column === column && activeSlot?.row === row;
}

export function getCardDragStateClassNames({ isActiveSlot, isDragged }: CardDragStateClassNamesOptions) {
  return {
    cardClassName: cn(
      "min-h-0 overflow-hidden will-change-transform transition-[opacity,transform,filter] duration-200",
      isDragged && "scale-[0.985] opacity-70 saturate-75"
    ),
    slotClassName: cn(
      "rounded-[1.75rem] border border-dashed bg-white/[0.02] transition",
      isActiveSlot ? "border-sky-200/55 bg-sky-200/10 shadow-[0_0_0_1px_rgba(186,230,253,0.24)]" : "border-white/8 hover:bg-white/[0.04]"
    )
  };
}
