import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cardBehaviorConstants, gridConstants, motionConstants } from "@/constants";
import { CardAddMenu } from "./CardAddMenu";
import { getCardDragStateClassNames, isActiveGridSlot, type ActiveGridSlot } from "./cardDragFeedback";
import { CardEditChrome } from "./CardEditChrome";
import { getBoardColumnCount, getPositionedRowCount, getWidgetBoardMetrics, getFootprintDimensions, resolveCardPositions } from "./gridLayout";
import { useCardLayout } from "./useCardLayout";
import type { CardDefinition } from "./types";

const widgetGapPx = gridConstants.gapPx;

type CardGridProps = {
  cards: CardDefinition[];
  isEditing: boolean;
};

export function CardGrid({ cards, isEditing }: CardGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = useRef(new Map<string, { left: number; top: number }>());
  const { addCard, availableCards, cards: runtimeCards, moveCard, removeCard, resizeCard } = useCardLayout({ cards });
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<ActiveGridSlot | null>(null);
  const [bounds, setBounds] = useState({ height: 720, width: 1152 });

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateMetrics = () => {
      setBounds({
        height: container.clientHeight,
        width: container.clientWidth
      });
    };

    updateMetrics();

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const isDesktop = bounds.width >= 768;
  const designUnit = isDesktop ? gridConstants.desktopDesignUnit : gridConstants.mobileDesignUnit;
  const minimumColumns = isDesktop ? gridConstants.desktopColumns : gridConstants.mobileColumns;
  const configuredUnit = isDesktop ? gridConstants.desktopUnit : gridConstants.mobileUnit;
  const fittedUnit = Math.floor((bounds.width - widgetGapPx * (minimumColumns - 1)) / minimumColumns);
  const lockedUnit = isDesktop ? configuredUnit : Math.min(configuredUnit, Math.max(1, fittedUnit));
  const columnCount = getBoardColumnCount(bounds.width, widgetGapPx, lockedUnit, minimumColumns);
  const visibleRows = Math.max(4, Math.floor((bounds.height + widgetGapPx) / (lockedUnit + widgetGapPx)));
  const positionedCards = useMemo(() => resolveCardPositions(runtimeCards, columnCount), [runtimeCards, columnCount]);
  const occupiedRows = getPositionedRowCount(runtimeCards, columnCount);
  const rowCount = Math.max(occupiedRows + 2, visibleRows);
  const metrics = getWidgetBoardMetrics({
    columnCount,
    gap: widgetGapPx,
    lockedUnit,
    rowCount
  });

  const style = {
    gridAutoRows: `${metrics.unitSize}px`,
    gridTemplateColumns: `repeat(${columnCount}, ${metrics.unitSize}px)`,
    "--widget-gap": "0.75rem",
    height: `${metrics.boardHeight}px`,
    width: `${metrics.boardWidth}px`
  } as CSSProperties;
  const backgroundCells = useMemo(
    () => Array.from({ length: rowCount * columnCount }, (_, index) => ({ column: index % columnCount, row: Math.floor(index / columnCount) })),
    [columnCount, rowCount]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const nextRects = new Map<string, { left: number; top: number }>();

    positionedCards.forEach(({ id }) => {
      const element = cardRefs.current.get(id);

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const nextRect = {
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top
      };

      nextRects.set(id, nextRect);

      const previousRect = previousRectsRef.current.get(id);

      if (!previousRect || draggedCardId === id) {
        return;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      element.style.transition = "none";
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      requestAnimationFrame(() => {
        element.style.transition = `transform ${motionConstants.reorderDurationMs}ms ${motionConstants.reorderEase}`;
        element.style.transform = "translate(0px, 0px)";
      });
    });

    previousRectsRef.current = nextRects;
  }, [draggedCardId, positionedCards]);

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden">
      <div className="flex h-full min-h-0 w-full items-start justify-start overflow-hidden" ref={containerRef}>
        <section
          className="relative grid min-h-0 content-start gap-[var(--widget-gap)] overflow-hidden"
          style={style}
        >
          {isEditing
            ? backgroundCells.map(({ column, row }) => (
              <button
                className={getCardDragStateClassNames({
                  isActiveSlot: isActiveGridSlot(activeSlot, column, row),
                  isDragged: false
                }).slotClassName}
                data-slot="true"
                key={`cell-${column}-${row}`}
                onDragEnter={() => {
                  if (draggedCardId) {
                    setActiveSlot({ column, row });
                    moveCard(draggedCardId, column, row);
                  }
                }}
                onDragLeave={() => {
                  if (isActiveGridSlot(activeSlot, column, row)) {
                    setActiveSlot(null);
                  }
                }}
                onDragOver={(event) => {
                  if (draggedCardId) {
                    event.preventDefault();
                  }
                }}
                style={{ gridColumn: `${column + 1} / span 1`, gridRow: `${row + 1} / span 1` }}
                type="button"
              />
            ))
            : null}
          {positionedCards.map(({ Component, column, footprint, id, row }) => {
            const { columns, rows } = getFootprintDimensions(footprint);
            const actualWidth = metrics.unitSize * columns + widgetGapPx * (columns - 1);
            const actualHeight = metrics.unitSize * rows + widgetGapPx * (rows - 1);
            const designWidth = designUnit * columns + widgetGapPx * (columns - 1);
            const designHeight = designUnit * rows + widgetGapPx * (rows - 1);
            const contentScale = Math.min(actualWidth / designWidth, actualHeight / designHeight);
            const offsetX = Math.max(0, (actualWidth - designWidth * contentScale) / 2);
            const offsetY = Math.max(0, (actualHeight - designHeight * contentScale) / 2);

            return (
              <div
                className={getCardDragStateClassNames({ isActiveSlot: false, isDragged: draggedCardId === id }).cardClassName}
                key={id}
                ref={(element) => {
                  if (element) {
                    cardRefs.current.set(id, element);
                  } else {
                    cardRefs.current.delete(id);
                  }
                }}
                style={{ gridColumn: `${column + 1} / span ${columns}`, gridRow: `${row + 1} / span ${rows}`, zIndex: draggedCardId === id ? 2 : 1 }}
              >
                <CardEditChrome
                  allowedFootprints={cardBehaviorConstants[id]?.allowedFootprints ?? [footprint]}
                  cardId={id}
                  footprint={footprint}
                  isDragging={draggedCardId === id}
                  isEditing={isEditing}
                  onDragEnd={() => {
                    setDraggedCardId(null);
                    setActiveSlot(null);
                  }}
                  onDragEnter={() => {
                    if (!draggedCardId || draggedCardId === id) {
                      return;
                    }

                    setActiveSlot({ column, row });
                    moveCard(draggedCardId, column, row);
                  }}
                  onDragStart={(cardId) => {
                    setDraggedCardId(cardId);
                    setActiveSlot({ column, row });
                  }}
                  onResize={(nextFootprint) => resizeCard(id, nextFootprint)}
                  onRemove={() => removeCard(id)}
                >
                  <div className="h-full w-full overflow-hidden">
                    <div
                      style={{
                        height: `${designHeight}px`,
                        marginLeft: `${offsetX}px`,
                        marginTop: `${offsetY}px`,
                        transform: `scale(${contentScale})`,
                        transformOrigin: "top left",
                        width: `${designWidth}px`
                      }}
                    >
                      <Component footprint={footprint} />
                    </div>
                  </div>
                </CardEditChrome>
              </div>
            );
          })}
        </section>
      </div>
      {isEditing ? <CardAddMenu cards={availableCards} onAddCard={addCard} /> : null}
    </div>
  );
}
