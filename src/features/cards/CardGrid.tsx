import { cn } from "@/lib/utils";
import type { CardDefinition, CardSize } from "./types";

const cardSizeClass: Record<CardSize, string> = {
  sm: "md:col-span-1",
  md: "md:col-span-2",
  lg: "md:col-span-2 xl:col-span-3",
  wide: "md:col-span-4"
};

type CardGridProps = {
  cards: CardDefinition[];
};

export function CardGrid({ cards }: CardGridProps) {
  return (
    <section className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-4">
      {cards.map(({ Component, id, size }) => (
        <div className={cn("min-h-56", cardSizeClass[size])} key={id}>
          <Component />
        </div>
      ))}
    </section>
  );
}
