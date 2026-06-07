import {
  ArrowDown,
  ArrowUp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Navigation,
  Sun,
  Wind,
  type LucideIcon,
  type LucideProps
} from "lucide-react";
import { cn } from "@/lib/utils";

export function getWeatherGlyph(conditionCode: string): LucideIcon {
  const code = conditionCode.toLowerCase();

  if (code.includes("thunder") || code.includes("lightning")) return CloudLightning;
  if (code.includes("snow") || code.includes("sleet") || code.includes("ice")) return CloudSnow;
  if (code.includes("drizzle")) return CloudDrizzle;
  if (code.includes("rain") || code.includes("shower")) return CloudRain;
  if (code.includes("fog") || code.includes("mist") || code.includes("haze")) return CloudFog;
  if (code.includes("wind")) return Wind;
  if (code.includes("partly") || code.includes("partlycloudy")) return CloudSun;
  if (code.includes("cloud") || code.includes("overcast")) return Cloud;
  if (code.includes("clear") || code.includes("sun") || code.includes("fair")) return Sun;

  return Cloud;
}

export function WeatherGlyph({ code, className, ...props }: { code: string } & LucideProps) {
  const Icon = getWeatherGlyph(code);
  return <Icon aria-hidden className={className} {...props} />;
}

export function WeatherLocation({ name, className }: { name: string; className?: string }) {
  return (
    <p className={cn("flex min-w-0 items-center gap-1 font-semibold tracking-tight text-white/95", className)}>
      <span className="truncate">{name}</span>
      <Navigation aria-hidden className="h-[0.7em] w-[0.7em] shrink-0 rotate-45 fill-current" />
    </p>
  );
}

export function WeatherHeader({ location, code }: { location: string; code: string }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2">
      <WeatherLocation name={location} className="text-[14px]" />
      <WeatherGlyph code={code} className="h-5 w-5 shrink-0 text-white/85" />
    </div>
  );
}

export function WeatherForecastHeader({ icon: Icon, location, title }: { icon: LucideIcon; location: string; title: string }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-white/90">
        <Icon aria-hidden className="h-4 w-4 shrink-0" />
        <span className="truncate">{title}</span>
      </p>
      <WeatherLocation name={location} className="max-w-[45%] justify-end text-right text-[11px] text-white/70" />
    </div>
  );
}

export function TempRange({
  temperature,
  high,
  low,
  temperatureClassName
}: {
  temperature: number;
  high: number;
  low: number;
  temperatureClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className={cn("font-light leading-none tracking-[-0.04em] text-white", temperatureClassName ?? "text-[3rem]")}>
        {temperature}°
      </p>
      <div className="space-y-0.5 text-[13px] font-semibold text-white/85">
        <p className="flex items-center gap-0.5">
          <ArrowUp className="h-3 w-3" />
          {high}°
        </p>
        <p className="flex items-center gap-0.5">
          <ArrowDown className="h-3 w-3" />
          {low}°
        </p>
      </div>
    </div>
  );
}
