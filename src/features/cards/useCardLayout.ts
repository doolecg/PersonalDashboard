import { useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "@/app/storage";
import { cardBehaviorConstants } from "@/constants";
import { mergeCardLayout } from "./gridLayout";
import type { CardDefinition, CardFootprint, PersistedCardLayout } from "./types";

const storageKey = "dashboard-card-layout";

type UseCardLayoutOptions = {
  cards: CardDefinition[];
};

export function useCardLayout({ cards }: UseCardLayoutOptions) {
  const [savedLayout, setSavedLayout] = useState<PersistedCardLayout[]>(() => readStorage(storageKey, [] as PersistedCardLayout[]));

  const runtimeCards = useMemo(() => mergeCardLayout(cards, savedLayout), [cards, savedLayout]);

  useEffect(() => {
    writeStorage(storageKey, savedLayout);
  }, [savedLayout]);

  const moveCard = (id: string, column: number, row: number) => {
    setSavedLayout(
      runtimeCards.map((card, order) => ({
        column: card.id === id ? column : card.column,
        id: card.id,
        footprint: card.footprint,
        order,
        row: card.id === id ? row : card.row
      }))
    );
  };

  const resizeCard = (id: string, footprint: CardFootprint) => {
    const card = runtimeCards.find((entry) => entry.id === id);

    if (!card) {
      return;
    }

    const allowedFootprints = cardBehaviorConstants[id]?.allowedFootprints ?? [card.footprint];

    if (!allowedFootprints.includes(footprint)) {
      return;
    }

    setSavedLayout(
      runtimeCards.map((entry, order) => ({
        column: entry.column,
        id: entry.id,
        footprint: entry.id === id ? footprint : entry.footprint,
        order,
        row: entry.row
      }))
    );
  };

  return {
    cards: runtimeCards,
    moveCard,
    resizeCard
  };
}
