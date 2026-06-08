import { useRef, useState, type DragEvent } from "react";

// Minimal HTML5 drag-to-reorder for a list. The caller renders a grip handle with
// `draggable` + onDragStart/onDragEnd, and makes each row a drop target with
// onDragOver. Items reorder live as you drag, and persist once on drop.
export function useDragReorder<T>(items: T[], setItems: (next: T[]) => void, persist: (next: T[]) => void) {
  const fromIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  function onDragStart(index: number) {
    fromIndex.current = index;
    setDragging(index);
  }

  function onDragOver(index: number, event: DragEvent) {
    event.preventDefault();
    const from = fromIndex.current;
    if (from === null || from === index) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    fromIndex.current = index;
    setDragging(index);
    setItems(next);
  }

  function onDragEnd() {
    fromIndex.current = null;
    setDragging(null);
    persist(items);
  }

  return { dragging, onDragStart, onDragOver, onDragEnd };
}
