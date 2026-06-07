import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WeatherTone = "storm" | "cloud" | "clear";

type WeatherWidgetFrameProps = {
  children: ReactNode;
  className?: string;
  tone?: WeatherTone;
};

const toneClassName: Record<WeatherTone, string> = {
  clear: "from-sky-400/80 via-sky-500/55 to-slate-900/80",
  cloud: "from-slate-200/65 via-slate-300/18 to-slate-900/82",
  storm: "from-sky-500/35 via-slate-700/35 to-slate-950/90"
};

export function WeatherWidgetFrame({ children, className, tone = "cloud" }: WeatherWidgetFrameProps) {
  return (
    <section
      className={cn(
        "relative h-full min-h-0 overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/55 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneClassName[tone])} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
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
