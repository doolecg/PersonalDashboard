import { Sparkles } from "lucide-react";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { useWeatherReport } from "./useWeatherReport";

export function AiWeatherReportCard({ footprint }: CardComponentProps) {
  const { data, error, loading } = useWeatherReport();
  const isCompact = footprint === "1x1" || footprint === "1x2";

  return (
    <WeatherWidgetFrame className={isCompact ? "p-4" : "p-5 md:p-6"} tone="cloud">
      <div className="flex h-full min-h-0 flex-col">
        <p className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-white/90">
          <Sparkles aria-hidden className="h-4 w-4 text-sky-200" />
          AI weather report
        </p>
        <div className="mt-2 flex min-h-0 flex-1 items-start overflow-hidden">
          {loading && !data ? (
            <p className="text-[13px] text-white/55">Writing your forecast…</p>
          ) : error && !data ? (
            <p className="text-[13px] text-rose-100">{error}</p>
          ) : (
            <p className={`font-light leading-snug text-white/92 ${isCompact ? "text-[14px]" : "text-[17px] md:text-[19px]"}`}>
              {data?.report}
            </p>
          )}
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
