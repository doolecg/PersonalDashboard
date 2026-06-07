import { useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "@/app/storage";
import { cardBehaviorConstants } from "@/constants";
import { mergeCardLayout } from "./gridLayout";
import type { CardDefinition, CardFootprint, PersistedCardLayout, RuntimeCardLayout } from "./types";

const storageKey = "dashboard-card-layout";

type UseCardLayoutOptions = {
  cards: CardDefinition[];
};

function serializeVisibleCards(cards: RuntimeCardLayout[]): PersistedCardLayout[] {
  return cards.map((card, order) => ({
    column: card.column,
    id: card.id,
    footprint: card.footprint,
    order,
    row: card.row,
    visible: true
  }));
}

export function useCardLayout({ cards }: UseCardLayoutOptions) {
  const [savedLayout, setSavedLayout] = useState<PersistedCardLayout[]>(() => readStorage(storageKey, [] as PersistedCardLayout[]));

  const runtimeCards = useMemo(() => mergeCardLayout(cards, savedLayout), [cards, savedLayout]);
  const availableCards = useMemo(() => {
    const visibleIds = new Set(runtimeCards.map((card) => card.id));
    return cards.filter((card) => !visibleIds.has(card.id));
  }, [cards, runtimeCards]);
  const preserveHiddenCards = (visibleCards: RuntimeCardLayout[]) => {
    const visibleIds = new Set(visibleCards.map((card) => card.id));
    return savedLayout.filter((card) => card.visible === false && !visibleIds.has(card.id));
  };

  useEffect(() => {
    writeStorage(storageKey, savedLayout);
  }, [savedLayout]);

  const moveCard = (id: string, column: number, row: number) => {
    setSavedLayout(
      [
        ...serializeVisibleCards(runtimeCards.map((card) => ({
          ...card,
          column: card.id === id ? column : card.column,
          row: card.id === id ? row : card.row
        }))),
        ...preserveHiddenCards(runtimeCards)
      ]
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

    const nextCards = runtimeCards.map((entry) => ({
      ...entry,
      footprint: entry.id === id ? footprint : entry.footprint
    }));

    setSavedLayout(
      [
        ...serializeVisibleCards(nextCards),
        ...preserveHiddenCards(nextCards)
      ]
    );
  };

  const removeCard = (id: string) => {
    const card = runtimeCards.find((entry) => entry.id === id);

    if (!card) {
      return;
    }

    const nextCards = runtimeCards.filter((entry) => entry.id !== id);
    setSavedLayout([
      ...serializeVisibleCards(nextCards),
      ...preserveHiddenCards(nextCards).filter((entry) => entry.id !== id),
      {
        column: card.column,
        id: card.id,
        footprint: card.footprint,
        order: runtimeCards.length,
        row: card.row,
        visible: false
      }
    ]);
  };

  const addCard = (id: string) => {
    if (runtimeCards.some((card) => card.id === id)) {
      return;
    }

    const card = cards.find((entry) => entry.id === id);

    if (!card) {
      return;
    }

    const savedEntry = savedLayout.find((entry) => entry.id === id);
    const allowedFootprints = cardBehaviorConstants[id]?.allowedFootprints ?? [card.footprint];
    const savedFootprint = savedEntry?.footprint ?? card.footprint;
    const nextCard: RuntimeCardLayout = {
      ...card,
      column: savedEntry?.column ?? 0,
      footprint: allowedFootprints.includes(savedFootprint) ? savedFootprint : card.footprint,
      order: runtimeCards.length,
      row: savedEntry?.row ?? 0
    };
    const nextCards = [...runtimeCards, nextCard];

    setSavedLayout([
      ...serializeVisibleCards(nextCards),
      ...preserveHiddenCards(nextCards).filter((entry) => entry.id !== id)
    ]);
  };

  return {
    addCard,
    availableCards,
    cards: runtimeCards,
    moveCard,
    removeCard,
    resizeCard
  };
}
