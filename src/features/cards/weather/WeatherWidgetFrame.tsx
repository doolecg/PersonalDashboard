import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type WeatherTone = "storm" | "cloud" | "clear";

type WeatherWidgetFrameProps = {
  children: ReactNode;
  className?: string;
  tone?: WeatherTone;
};

// Subtle per-tone wash layered over the shared planner-glass body. Kept low in
// opacity so the premium frosted look stays consistent across every card.
const toneClassName: Record<WeatherTone, string> = {
  clear: "from-sky-400/30 via-sky-500/10 to-transparent",
  cloud: "from-white/[0.08] via-white/[0.02] to-transparent",
  storm: "from-indigo-400/20 via-slate-700/10 to-transparent"
};

// Mirrors the Planner dashboard's `.glass` primitive (planner.css): layered
// translucent gradients fake the frost (no backdrop-filter, per SPEC), with a
// soft top sheen, hairline border and a deep ambient shadow.
const glassBackground =
  "linear-gradient(157deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0.02) 100%)," +
  "linear-gradient(157deg, rgba(74,80,124,0.5) 0%, rgba(34,38,70,0.6) 100%)";

const glassStyle: CSSProperties = {
  background: glassBackground,
  boxShadow:
    "0 20px 54px rgba(6,8,28,0.4), inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -16px 40px rgba(255,255,255,0.03), inset 0 0 0 0.5px rgba(255,255,255,0.05)"
};

export function WeatherWidgetFrame({ children, className, tone = "cloud" }: WeatherWidgetFrameProps) {
  return (
    <section
      className={cn(
        "relative h-full min-h-0 overflow-hidden rounded-[26px] border border-white/[0.18] text-white",
        className
      )}
      style={glassStyle}
    >
      {/* top sheen — matches .glass::before */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/20 to-transparent opacity-50" />
      {/* tone wash */}
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", toneClassName[tone])} />
      {/* corner glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_46%)]" />
      <div className="relative flex h-full min-h-0 flex-col">{children}</div>
    </section>
  );
}

export function WeatherSectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/58">{children}</p>;
}

export function WeatherDivider() {
  return <div className="h-px w-full bg-white/14" />;
}
