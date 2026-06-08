import { useRef, type PointerEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import type { PanelState } from "./useDesktopLayout";

type Rect = { x: number; y: number; w: number; h: number };

type DesktopWindowProps = {
  title: string;
  icon: ReactNode;
  state: PanelState;
  zIndex: number;
  bounds: { w: number; h: number };
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onSnap: (rect: Rect) => void;
  onClose: () => void;
  onFocus: () => void;
  children: ReactNode;
};

const SNAP = 28;

export function DesktopWindow({
  title,
  icon,
  state,
  zIndex,
  bounds,
  onMove,
  onResize,
  onSnap,
  onClose,
  onFocus,
  children
}: DesktopWindowProps) {
  const dragRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ px: number; py: number; w: number; h: number } | null>(null);

  function startDrag(event: PointerEvent) {
    // Ignore drags that start on the close button.
    if ((event.target as HTMLElement).closest(".desk-win-btn")) return;
    onFocus();
    dragRef.current = { px: event.clientX, py: event.clientY, x: state.x, y: state.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onDragMove(event: PointerEvent) {
    const start = dragRef.current;
    if (!start) return;
    onMove(start.x + (event.clientX - start.px), start.y + (event.clientY - start.py));
  }

  function endDrag(event: PointerEvent) {
    const wasDragging = dragRef.current !== null;
    dragRef.current = null;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // pointer already released
    }
    if (!wasDragging || !bounds.w || !bounds.h) return;

    // Aero-style edge snapping based on where the window landed.
    if (state.y <= SNAP) {
      onSnap({ x: 0, y: 0, w: bounds.w, h: bounds.h }); // maximize
    } else if (state.x <= SNAP) {
      onSnap({ x: 0, y: 0, w: Math.round(bounds.w / 2), h: bounds.h }); // left half
    } else if (state.x + state.w >= bounds.w - SNAP) {
      onSnap({ x: Math.round(bounds.w / 2), y: 0, w: Math.round(bounds.w / 2), h: bounds.h }); // right half
    }
  }

  function startResize(event: PointerEvent) {
    event.stopPropagation();
    onFocus();
    resizeRef.current = { px: event.clientX, py: event.clientY, w: state.w, h: state.h };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onResizeMove(event: PointerEvent) {
    const start = resizeRef.current;
    if (!start) return;
    onResize(start.w + (event.clientX - start.px), start.h + (event.clientY - start.py));
  }

  function endResize(event: PointerEvent) {
    resizeRef.current = null;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // pointer already released
    }
  }

  return (
    <div
      className="glass desk-win"
      style={{ left: state.x, top: state.y, width: state.w, height: state.h, zIndex }}
      onPointerDown={onFocus}
    >
      <div
        className="desk-titlebar"
        onPointerDown={startDrag}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
      >
        <span className="desk-win-icon">{icon}</span>
        <span className="desk-win-title">{title}</span>
        <button className="desk-win-btn" aria-label={`Close ${title}`} onClick={onClose} type="button">
          <X size={13} />
        </button>
      </div>
      <div className="desk-win-body">{children}</div>
      <span
        className="desk-resize"
        onPointerDown={startResize}
        onPointerMove={onResizeMove}
        onPointerUp={endResize}
        aria-hidden
      />
    </div>
  );
}
