import type { CardDefinition, CardFootprint } from "./types";

type FootprintDimensions = {
  columns: number;
  rows: number;
};

type BoardMetricsOptions = {
  availableHeight: number;
  availableWidth: number;
  columnCount: number;
  gap: number;
  rowCount: number;
  scale?: number;
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
  "4x2": { columns: 4, rows: 2 }
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

export function getWidgetBoardMetrics({ availableHeight, availableWidth, columnCount, gap, rowCount, scale = 1 }: BoardMetricsOptions): WidgetBoardMetrics {
  const widthUnit = (availableWidth - gap * (columnCount - 1)) / columnCount;
  const heightUnit = (availableHeight - gap * (rowCount - 1)) / rowCount;
  const unitSize = Math.max(0, Math.floor(Math.min(widthUnit, heightUnit) * scale));

  return {
    boardHeight: unitSize * rowCount + gap * (rowCount - 1),
    boardWidth: unitSize * columnCount + gap * (columnCount - 1),
    unitSize
  };
}
