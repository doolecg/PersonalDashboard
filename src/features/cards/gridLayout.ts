import { cardBehaviorConstants } from "@/constants";
import type { CardDefinition, CardFootprint, PersistedCardLayout, RuntimeCardLayout } from "./types";

type FootprintDimensions = {
  columns: number;
  rows: number;
};

type PositionedCardLayout = RuntimeCardLayout;

type BoardMetricsOptions = {
  columnCount: number;
  gap: number;
  lockedUnit?: number;
  rowCount: number;
  scale?: number;
  availableHeight?: number;
  availableWidth?: number;
};

export type WidgetBoardMetrics = {
  boardHeight: number;
  boardWidth: number;
  unitSize: number;
};

const footprintDimensions: Record<CardFootprint, FootprintDimensions> = {
  "1x1": { columns: 1, rows: 1 },
  "2x1": { columns: 2, rows: 1 },
  "2x2": { columns: 2, rows: 2 },
  "1x2": { columns: 1, rows: 2 },
  "4x2": { columns: 4, rows: 2 },
  "4x4": { columns: 4, rows: 4 }
};

function canPlace(occupancy: boolean[][], startColumn: number, startRow: number, columns: number, rows: number) {
  for (let row = startRow; row < startRow + rows; row += 1) {
    for (let column = startColumn; column < startColumn + columns; column += 1) {
      if (occupancy[row]?.[column]) {
        return false;
      }
    }
  }

  return true;
}

function markPlaced(occupancy: boolean[][], startColumn: number, startRow: number, columns: number, rows: number) {
  for (let row = startRow; row < startRow + rows; row += 1) {
    occupancy[row] ??= [];

    for (let column = startColumn; column < startColumn + columns; column += 1) {
      occupancy[row][column] = true;
    }
  }
}

function findNextOpenSlot(occupancy: boolean[][], columnCount: number, columns: number, rows: number) {
  let row = 0;

  while (true) {
    for (let column = 0; column <= columnCount - columns; column += 1) {
      if (canPlace(occupancy, column, row, columns, rows)) {
        return { column, row };
      }
    }

    row += 1;
  }
}

export function getFootprintDimensions(footprint: CardFootprint) {
  return footprintDimensions[footprint];
}

export function getBoardRowCount(cards: CardDefinition[], columnCount: number) {
  const occupancy: boolean[][] = [];
  let maxRow = 0;

  for (const card of cards) {
    const { columns, rows } = getFootprintDimensions(card.footprint);

    if (columns > columnCount) {
      throw new Error(`Footprint ${card.footprint} exceeds ${columnCount} columns`);
    }

    let placed = false;
    let row = 0;

    while (!placed) {
      for (let column = 0; column <= columnCount - columns; column += 1) {
        if (!canPlace(occupancy, column, row, columns, rows)) {
          continue;
        }

        markPlaced(occupancy, column, row, columns, rows);
        maxRow = Math.max(maxRow, row + rows);
        placed = true;
        break;
      }

      row += 1;
    }
  }

  return maxRow;
}

export function getBoardColumnCount(availableWidth: number, gap: number, lockedUnit: number, minimumColumns: number) {
  return Math.max(minimumColumns, Math.floor((availableWidth + gap) / (lockedUnit + gap)));
}

export function mergeCardLayout(cards: CardDefinition[], saved: PersistedCardLayout[]): RuntimeCardLayout[] {
  const savedById = new Map(saved.map((entry) => [entry.id, entry]));

  return cards
    .map((card, index) => {
      const savedEntry = savedById.get(card.id);
      const allowedFootprints = cardBehaviorConstants[card.id]?.allowedFootprints;
      const nextFootprint = savedEntry?.footprint ?? card.footprint;

      return {
        ...card,
        column: savedEntry?.column ?? 0,
        footprint: allowedFootprints?.includes(nextFootprint) ? nextFootprint : card.footprint,
        order: savedEntry?.order ?? index
        ,row: savedEntry?.row ?? 0
      };
    })
    .sort((left, right) => left.order - right.order);
}

export function resolveCardPositions(cards: RuntimeCardLayout[], columnCount: number): PositionedCardLayout[] {
  const occupancy: boolean[][] = [];

  return cards.map((card) => {
    const { columns, rows } = getFootprintDimensions(card.footprint);
    const preferredColumn = Math.max(0, Math.min(card.column, columnCount - columns));
    const preferredRow = Math.max(0, card.row);
    const slot = canPlace(occupancy, preferredColumn, preferredRow, columns, rows)
      ? { column: preferredColumn, row: preferredRow }
      : findNextOpenSlot(occupancy, columnCount, columns, rows);

    markPlaced(occupancy, slot.column, slot.row, columns, rows);

    return {
      ...card,
      column: slot.column,
      row: slot.row
    };
  });
}

export function getPositionedRowCount(cards: RuntimeCardLayout[], columnCount: number) {
  return resolveCardPositions(cards, columnCount).reduce((maxRow, card) => {
    const { rows } = getFootprintDimensions(card.footprint);
    return Math.max(maxRow, card.row + rows);
  }, 0);
}

export function getWidgetBoardMetrics({ availableHeight, availableWidth, columnCount, gap, lockedUnit, rowCount, scale = 1 }: BoardMetricsOptions): WidgetBoardMetrics {
  const fallbackWidthUnit = availableWidth ? (availableWidth - gap * (columnCount - 1)) / columnCount : 0;
  const fallbackHeightUnit = availableHeight ? (availableHeight - gap * (rowCount - 1)) / rowCount : 0;
  const computedUnit = Math.min(fallbackWidthUnit || Number.POSITIVE_INFINITY, fallbackHeightUnit || Number.POSITIVE_INFINITY);
  const baseUnit = lockedUnit ?? computedUnit;
  const unitSize = Math.max(0, Math.floor(baseUnit * scale));

  return {
    boardHeight: unitSize * rowCount + gap * (rowCount - 1),
    boardWidth: unitSize * columnCount + gap * (columnCount - 1),
    unitSize
  };
}
