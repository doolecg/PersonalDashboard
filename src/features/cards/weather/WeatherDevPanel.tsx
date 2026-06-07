import { cn } from "@/lib/utils";
import { useWeatherData } from "./useWeatherData";
import type { WeatherDevScenario } from "./devWeatherScenarios";

const scenarioOptions: WeatherDevScenario[] = ["live", "clear", "rain", "snow", "thunder", "alerts"];

export function WeatherDevPanel() {
  const { scenario, setScenario } = useWeatherData();

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-[1.25rem] border border-white/12 bg-slate-950/70 p-1.5 text-white shadow-2xl backdrop-blur-xl">
      {scenarioOptions.map((option) => (
        <button
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-medium capitalize tracking-[0.04em] transition",
            option === scenario ? "bg-white/20 text-white" : "text-white/62 hover:bg-white/10 hover:text-white"
          )}
          key={option}
          onClick={() => setScenario(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
