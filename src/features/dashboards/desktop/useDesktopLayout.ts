import { useCallback, useEffect, useState } from "react";

export type PanelState = { x: number; y: number; w: number; h: number; visible: boolean };
export type DesktopLayout = Record<string, PanelState>;

const STORAGE_KEY = "desktop-layout";

export const MIN_W = 220;
export const MIN_H = 120;

// Default tiled positions, laid out like a fresh desktop.
export const DEFAULT_LAYOUT: DesktopLayout = {
  host: { x: 24, y: 24, w: 340, h: 300, visible: true },
  server: { x: 384, y: 24, w: 300, h: 190, visible: true },
  storage: { x: 384, y: 232, w: 300, h: 150, visible: true },
  utilities: { x: 24, y: 344, w: 360, h: 230, visible: true },
  calculator: { x: 704, y: 24, w: 260, h: 360, visible: false }
};

function readStored(): DesktopLayout {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw) as Partial<DesktopLayout>;
    // Merge over defaults so new panels appear and missing fields are filled.
    const merged: DesktopLayout = {};
    for (const [id, def] of Object.entries(DEFAULT_LAYOUT)) {
      merged[id] = { ...def, ...(parsed[id] ?? {}) };
    }
    return merged;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useDesktopLayout() {
  const [layout, setLayout] = useState<DesktopLayout>(() =>
    typeof window === "undefined" ? DEFAULT_LAYOUT : readStored()
  );
  // Stacking order — last id is topmost.
  const [order, setOrder] = useState<string[]>(() => Object.keys(DEFAULT_LAYOUT));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // ignore storage errors
    }
  }, [layout]);

  const patch = useCallback((id: string, next: Partial<PanelState>) => {
    setLayout((prev) => ({ ...prev, [id]: { ...prev[id], ...next } }));
  }, []);

  const move = useCallback(
    (id: string, x: number, y: number) => patch(id, { x: Math.max(0, x), y: Math.max(0, y) }),
    [patch]
  );

  const resize = useCallback(
    (id: string, w: number, h: number) => patch(id, { w: Math.max(MIN_W, w), h: Math.max(MIN_H, h) }),
    [patch]
  );

  // Snap a window to a screen region (edge/half/maximize) in one update.
  const snap = useCallback(
    (id: string, rect: { x: number; y: number; w: number; h: number }) => patch(id, rect),
    [patch]
  );

  const toggle = useCallback((id: string) => {
    setLayout((prev) => ({ ...prev, [id]: { ...prev[id], visible: !prev[id].visible } }));
  }, []);

  const focus = useCallback((id: string) => {
    setOrder((prev) => [...prev.filter((item) => item !== id), id]);
  }, []);

  const reset = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    setOrder(Object.keys(DEFAULT_LAYOUT));
  }, []);

  return { layout, order, move, resize, snap, toggle, focus, reset };
}
