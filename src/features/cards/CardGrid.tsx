import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getBoardRowCount, getWidgetBoardMetrics } from "./gridLayout";
import type { CardDefinition, CardFootprint } from "./types";

const mobileColumnCount = 4;
const desktopColumnCount = 6;
const widgetGapPx = 12;
const widgetScale = 1;

const footprintClassName: Record<CardFootprint, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "2x2": "col-span-2 row-span-2",
  "1x2": "col-span-1 row-span-2",
  "4x2": "col-span-4 row-span-2 md:col-span-4"
};

type CardGridProps = {
  cards: CardDefinition[];
};

export function CardGrid({ cards }: CardGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mobileRowCount = getBoardRowCount(cards, mobileColumnCount);
  const desktopRowCount = getBoardRowCount(cards, desktopColumnCount);
  const [metrics, setMetrics] = useState(() => ({
    desktop: getWidgetBoardMetrics({
      availableHeight: 720,
      availableWidth: 1152,
      columnCount: desktopColumnCount,
      gap: widgetGapPx,
      rowCount: desktopRowCount,
      scale: widgetScale
    }),
    mobile: getWidgetBoardMetrics({
      availableHeight: 720,
      availableWidth: 400,
      columnCount: mobileColumnCount,
      gap: widgetGapPx,
      rowCount: mobileRowCount,
      scale: widgetScale
    })
  }));

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateMetrics = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;

      setMetrics({
        desktop: getWidgetBoardMetrics({
          availableHeight: nextHeight,
          availableWidth: nextWidth,
          columnCount: desktopColumnCount,
          gap: widgetGapPx,
          rowCount: desktopRowCount,
          scale: widgetScale
        }),
        mobile: getWidgetBoardMetrics({
          availableHeight: nextHeight,
          availableWidth: nextWidth,
          columnCount: mobileColumnCount,
          gap: widgetGapPx,
          rowCount: mobileRowCount,
          scale: widgetScale
        })
      });
    };

    updateMetrics();

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [desktopRowCount, mobileRowCount]);

  const style = {
    "--widget-board-height": `${metrics.mobile.boardHeight}px`,
    "--widget-board-height-desktop": `${metrics.desktop.boardHeight}px`,
    "--widget-board-width": `${metrics.mobile.boardWidth}px`,
    "--widget-board-width-desktop": `${metrics.desktop.boardWidth}px`,
    "--widget-gap": "0.75rem",
    "--widget-unit": `${metrics.mobile.unitSize}px`,
    "--widget-unit-desktop": `${metrics.desktop.unitSize}px`
  } as CSSProperties;

  return (
    <div className="flex h-full w-full min-h-0 items-center justify-center overflow-hidden" ref={containerRef}>
      <section
        className="grid h-[var(--widget-board-height)] w-[var(--widget-board-width)] min-h-0 grid-cols-[repeat(4,var(--widget-unit))] auto-rows-[var(--widget-unit)] gap-[var(--widget-gap)] overflow-hidden md:h-[var(--widget-board-height-desktop)] md:w-[var(--widget-board-width-desktop)] md:grid-cols-[repeat(6,var(--widget-unit-desktop))] md:auto-rows-[var(--widget-unit-desktop)]"
        style={style}
      >
        {cards.map(({ Component, footprint, id }) => (
          <div className={cn("min-h-0 overflow-hidden", footprintClassName[footprint])} key={id}>
            <Component />
          </div>
        ))}
      </section>
    </div>
  );
}
