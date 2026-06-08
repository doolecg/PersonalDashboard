import type { CSSProperties } from "react";

// Shimmering skeleton lines for AI "thinking" states (summary generating, chat
// awaiting a reply). Each bar has a staggered travelling shine. CSS lives in
// planner.css (.ai-skeleton / .skeleton-line).
const DEFAULT_WIDTHS = [100, 88, 94, 66];

export function AiSkeleton({ widths = DEFAULT_WIDTHS }: { widths?: number[] }) {
  return (
    <div className="ai-skeleton" aria-hidden>
      {widths.map((width, index) => (
        <div
          className="skeleton-line"
          key={index}
          style={{ width: `${width}%`, "--shine-delay": `${index * 90}ms` } as CSSProperties}
        />
      ))}
    </div>
  );
}
