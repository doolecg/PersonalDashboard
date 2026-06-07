import { Sparkle, TrendingUp } from "lucide-react";
import type { CardComponentProps } from "../types";
import { WeatherWidgetFrame } from "./WeatherWidgetFrame";
import { useWeatherReport } from "./useWeatherReport";

export function WeatherInsightCard(_props: CardComponentProps) {
  const { data, error, loading } = useWeatherReport();

  return (
    <WeatherWidgetFrame className="p-4 md:p-5" tone="cloud">
      <div className="flex h-full min-h-0 flex-col justify-center">
        <p className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-white/90">
          <span className="relative inline-flex">
            <TrendingUp aria-hidden className="h-4 w-4 text-sky-200" />
            <Sparkle aria-hidden className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 fill-current text-sky-100" />
          </span>
          Weather insight
        </p>
        <p className="mt-2 text-[15px] font-light leading-snug text-white/90 md:text-[16px]">
          {loading && !data ? "Analysing the trend…" : error && !data ? error : data?.insight}
        </p>
      </div>
    </WeatherWidgetFrame>
  );
}
