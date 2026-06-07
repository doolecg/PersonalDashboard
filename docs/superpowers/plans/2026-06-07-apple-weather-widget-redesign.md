# Apple Weather Widget Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the weather card set into an Apple Weather-inspired widget system while keeping the existing weather data source and locking the full dashboard inside the browser viewport with no page scrolling.

**Architecture:** Keep `useWeatherData` and `WeatherWidgetPayload` unchanged as the weather data boundary. Add a small weather presentation helper module for formatting and range math, add a weather-specific widget surface wrapper for shared glass styling, then restyle each weather card around that system. Finish with a small shell/grid sizing pass so the header, weather grid, and footer fit inside the viewport without horizontal or vertical page overflow.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest

---

## File Map

### Create

- `src/features/cards/weather/weatherPresentation.ts`
  - Pure helpers for condition labels, display fallbacks, precipitation label formatting, and day-range normalization.
- `src/features/cards/weather/WeatherWidgetFrame.tsx`
  - Weather-specific surface wrapper and tiny shared UI primitives used by multiple weather cards.
- `tests/weatherCardPresentation.test.ts`
  - Vitest coverage for pure presentation helpers.

### Modify

- `src/App.tsx`
  - Lock the main shell to the viewport and give the grid a bounded content region.
- `src/features/cards/CardGrid.tsx`
  - Let the weather grid consume available height without creating page overflow.
- `src/features/cards/weather/WeatherCard.tsx`
  - Convert to hero card composition and use the weather widget frame.
- `src/features/cards/weather/PrecipitationCard.tsx`
  - Convert chart card to Apple-like precipitation widget.
- `src/features/cards/weather/HourlyForecastCard.tsx`
  - Replace boxed rail with denser hourly strip.
- `src/features/cards/weather/TenDayForecastCard.tsx`
  - Replace generic rows with daily forecast rows and range bars.
- `src/features/cards/weather/WeatherDetailsCard.tsx`
  - Replace equal-weight metric tiles with a compact support layout.
- `src/features/cards/registry.ts`
  - Adjust weather card size roles to support hero/support composition.
- `src/app/shell/ShellHeader.tsx`
  - Tighten shell height and spacing if needed to preserve the no-scroll viewport fit.
- `src/app/shell/ShellFooter.tsx`
  - Tighten footer height and preserve ticker clipping within the viewport width.

## Task 1: Add Pure Weather Presentation Helpers

**Files:**
- Create: `tests/weatherCardPresentation.test.ts`
- Create: `src/features/cards/weather/weatherPresentation.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from "vitest";
import {
  clampPercentage,
  formatConditionLabel,
  formatPrecipitationWindowLabel,
  getTemperatureRangeSegments
} from "../src/features/cards/weather/weatherPresentation";

describe("weather card presentation helpers", () => {
  it("formats underscored condition codes into title-cased labels", () => {
    expect(formatConditionLabel("partly_cloudy_day", "")).toBe("Partly Cloudy Day");
  });

  it("prefers provided condition labels when present", () => {
    expect(formatConditionLabel("rain_showers", "Rain starting soon")).toBe("Rain starting soon");
  });

  it("formats the next-hour precipitation window labels", () => {
    expect(formatPrecipitationWindowLabel("Now", 60)).toEqual({
      leadingLabel: "Now",
      trailingLabel: "60m"
    });
  });

  it("clamps percentage values into the expected UI range", () => {
    expect(clampPercentage(-10)).toBe(0);
    expect(clampPercentage(42)).toBe(42);
    expect(clampPercentage(160)).toBe(100);
  });

  it("returns normalized temperature segments for forecast bars", () => {
    expect(
      getTemperatureRangeSegments(
        [
          { lowC: 10, highC: 18 },
          { lowC: 7, highC: 21 },
          { lowC: 12, highC: 16 }
        ],
        { lowC: 10, highC: 18 }
      )
    ).toEqual({
      startPercent: 21.4,
      widthPercent: 57.1
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/weatherCardPresentation.test.ts`

Expected: FAIL because `src/features/cards/weather/weatherPresentation.ts` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

```ts
type TemperatureRange = {
  lowC?: number;
  highC?: number;
};

export function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function formatConditionLabel(conditionCode: string, conditionLabel?: string) {
  if (conditionLabel?.trim()) return conditionLabel.trim();
  return conditionCode
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPrecipitationWindowLabel(leadingLabel: string, minutes: number) {
  return {
    leadingLabel,
    trailingLabel: `${Math.round(minutes)}m`
  };
}

export function getTemperatureRangeSegments(allDays: TemperatureRange[], day: TemperatureRange) {
  const lows = allDays.map((item) => item.lowC).filter((value): value is number => value !== undefined);
  const highs = allDays.map((item) => item.highC).filter((value): value is number => value !== undefined);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = Math.max(1, max - min);
  const startPercent = clampPercentage((((day.lowC ?? min) - min) / span) * 100);
  const widthPercent = clampPercentage((((day.highC ?? max) - (day.lowC ?? min)) / span) * 100);

  return {
    startPercent: Number(startPercent.toFixed(1)),
    widthPercent: Number(widthPercent.toFixed(1))
  };
}
```

- [ ] **Step 4: Run the helper test again**

Run: `npm test -- tests/weatherCardPresentation.test.ts`

Expected: PASS with 5 tests passing.

- [ ] **Step 5: Run a broader guard check**

Run: `npm test -- tests/weatherPresentation.test.ts`

Expected: PASS to confirm the new helper module does not conflict with existing weather presentation behavior.

## Task 2: Add the Shared Weather Widget Frame and Resize Roles

**Files:**
- Create: `src/features/cards/weather/WeatherWidgetFrame.tsx`
- Modify: `src/features/cards/registry.ts`

- [ ] **Step 1: Add the shared widget frame**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WeatherWidgetFrameProps = {
  children: ReactNode;
  className?: string;
  tone?: "storm" | "cloud" | "clear";
};

const toneClassName = {
  clear: "from-sky-400/80 via-sky-500/55 to-slate-900/80",
  cloud: "from-slate-200/65 via-slate-300/18 to-slate-900/82",
  storm: "from-sky-500/35 via-slate-700/35 to-slate-950/90"
} as const;

export function WeatherWidgetFrame({ children, className, tone = "cloud" }: WeatherWidgetFrameProps) {
  return (
    <section
      className={cn(
        "relative h-full overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/55 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneClassName[tone])} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
      <div className="relative flex h-full flex-col">{children}</div>
    </section>
  );
}

export function WeatherSectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/58">{children}</p>;
}

export function WeatherDivider() {
  return <div className="h-px w-full bg-white/14" />;
}
```

- [ ] **Step 2: Update the weather card size roles in the registry**

```ts
export const cardRegistry: CardDefinition[] = [
  {
    id: "example",
    title: "Base Card",
    description: "Reference card structure.",
    size: "md",
    Component: ExampleCard
  },
  {
    id: "weather-current",
    title: "Current Weather",
    description: "Current local conditions.",
    size: "lg",
    Component: WeatherCard
  },
  {
    id: "weather-precipitation",
    title: "Precipitation",
    description: "Short-term rain outlook.",
    size: "lg",
    Component: PrecipitationCard
  },
  {
    id: "weather-hourly",
    title: "Hourly Forecast",
    description: "24-hour temperature and precipitation.",
    size: "wide",
    Component: HourlyForecastCard
  },
  {
    id: "weather-ten-day",
    title: "10-Day Forecast",
    description: "Longer daily outlook.",
    size: "lg",
    Component: TenDayForecastCard
  },
  {
    id: "weather-details",
    title: "Weather Details",
    description: "Current weather metrics.",
    size: "sm",
    Component: WeatherDetailsCard
  }
];
```

- [ ] **Step 3: Run typecheck after adding the shared frame**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors from the new frame or registry changes.

## Task 3: Lock the Shell and Grid to the Viewport

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/cards/CardGrid.tsx`
- Modify: `src/app/shell/ShellHeader.tsx`
- Modify: `src/app/shell/ShellFooter.tsx`

- [ ] **Step 1: Update the shell layout in `src/App.tsx` so the page cannot grow beyond the viewport**

```tsx
function App() {
  const { userName, tickerItems } = useShellConfig();
  const { dateText, timeText } = useShellClock();
  const connection = useConnectionStatus();

  return (
    <main className="dark h-svh overflow-hidden bg-background text-foreground">
      <div className={shellBackgroundClassName}>
        <div className={shellBackgroundImageClassName} style={{ backgroundImage: `url(${bgImage})` }} />
      </div>
      <div className="relative z-10 flex h-full flex-col gap-3 px-4 py-3">
        <ShellHeader userName={userName} timeText={timeText} dateText={dateText} />
        <div className="flex min-h-0 flex-1 justify-center">
          <CardGrid cards={cardRegistry} />
        </div>
        <ShellFooter tickerItems={tickerItems} connection={connection} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update `CardGrid.tsx` to fit the available viewport height and clip overflow**

```tsx
export function CardGrid({ cards }: CardGridProps) {
  return (
    <section className="grid h-full w-full max-w-6xl min-h-0 grid-cols-1 gap-3 overflow-hidden md:grid-cols-4 auto-rows-fr">
      {cards.map(({ Component, id, size }) => (
        <div className={cn("min-h-0 overflow-hidden", cardSizeClass[size])} key={id}>
          <Component />
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Tighten the header and footer so they reserve less vertical space**

```tsx
// ShellHeader.tsx
<header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-3xl border border-border/95 bg-background/55 px-5 py-3 backdrop-blur-xl">

// ShellFooter.tsx
<footer className="mx-auto flex w-full max-w-6xl items-center gap-4 overflow-hidden rounded-3xl border border-border/60 bg-background/55 px-4 py-2.5 backdrop-blur-xl">
```

- [ ] **Step 4: Run typecheck after the shell/grid viewport lock**

Run: `npm run typecheck`

Expected: PASS.

## Task 4: Rebuild the Hero Current-Weather and Compact Details Cards

**Files:**
- Modify: `src/features/cards/weather/WeatherCard.tsx`
- Modify: `src/features/cards/weather/WeatherDetailsCard.tsx`

- [ ] **Step 1: Replace `WeatherCard` with the hero composition**

```tsx
import { MapPin, SunMedium } from "lucide-react";
import { WeatherWidgetFrame, WeatherDivider, WeatherSectionLabel } from "./WeatherWidgetFrame";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function WeatherCard() {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return <WeatherWidgetFrame className="p-6"><p className="text-sm text-white/72">Loading weather...</p></WeatherWidgetFrame>;
  }

  if (error && !data) {
    return <WeatherWidgetFrame className="p-6"><p className="text-sm text-rose-100">{error}</p></WeatherWidgetFrame>;
  }

  if (!data) return null;

  return (
    <WeatherWidgetFrame className="p-6 md:p-7" tone="cloud">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-white">
            <MapPin className="h-4 w-4" />
            {data.current.location}
          </p>
          <p className="mt-3 text-[5.5rem] font-light leading-none tracking-[-0.06em] text-white">
            {Math.round(data.current.temperatureC)}°
          </p>
        </div>
        <SunMedium className="mt-1 h-6 w-6 text-white/80" />
      </div>

      <div className="mt-auto space-y-3">
        <p className="text-xl font-medium text-white/92">
          {formatConditionLabel(data.current.conditionCode, data.current.conditionLabel)}
        </p>
        <p className="text-sm text-white/64">
          H:{Math.round(data.current.highC ?? data.current.temperatureC)}° L:{Math.round(data.current.lowC ?? data.current.temperatureC)}°
        </p>
        <WeatherDivider />
        <div className="flex items-end justify-between gap-4">
          <div>
            <WeatherSectionLabel>Feels Like</WeatherSectionLabel>
            <p className="mt-1 text-2xl font-medium text-white">{Math.round(data.current.feelsLikeC ?? data.current.temperatureC)}°</p>
          </div>
          <p className="max-w-[16rem] text-right text-sm text-white/68">{data.current.summary}</p>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
```

- [ ] **Step 2: Replace `WeatherDetailsCard` with a compact support widget**

```tsx
import { WeatherWidgetFrame, WeatherDivider, WeatherSectionLabel } from "./WeatherWidgetFrame";
import { useWeatherData } from "./useWeatherData";

function formatTime(value?: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function WeatherDetailsCard() {
  const { data, error, loading } = useWeatherData();
  const details = data?.details;

  if (loading && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-white/72">Loading details...</p></WeatherWidgetFrame>;
  }

  if (error && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-rose-100">{error}</p></WeatherWidgetFrame>;
  }

  if (!data) return null;

  return (
    <WeatherWidgetFrame className="p-5" tone="clear">
      <WeatherSectionLabel>Conditions</WeatherSectionLabel>
      <div className="mt-4 space-y-4">
        <div>
          <p className="text-4xl font-light tracking-tight text-white">{Math.round(details?.uvIndex ?? 0)}</p>
          <p className="text-sm text-white/62">UV index</p>
        </div>
        <WeatherDivider />
        <div className="space-y-2 text-sm text-white/80">
          <div className="flex justify-between gap-3"><span className="text-white/58">Humidity</span><span>{Math.round(details?.humidityPercent ?? 0)}%</span></div>
          <div className="flex justify-between gap-3"><span className="text-white/58">Wind</span><span>{Math.round(details?.windKmh ?? 0)} km/h</span></div>
          <div className="flex justify-between gap-3"><span className="text-white/58">Sun</span><span>{formatTime(details?.sunrise)} / {formatTime(details?.sunset)}</span></div>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
```

- [ ] **Step 3: Run typecheck after the hero/support card rebuild**

Run: `npm run typecheck`

Expected: PASS with no JSX or type errors.

## Task 5: Rebuild the Precipitation and Hourly Forecast Widgets

**Files:**
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
- Modify: `src/features/cards/weather/HourlyForecastCard.tsx`

- [ ] **Step 1: Replace the precipitation card with a native-feeling graph module**

```tsx
import { CloudRain } from "lucide-react";
import { WeatherWidgetFrame, WeatherDivider, WeatherSectionLabel } from "./WeatherWidgetFrame";
import { clampPercentage, formatPrecipitationWindowLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function PrecipitationCard() {
  const { data, error, loading } = useWeatherData();
  const points = data?.precipitation.points ?? [];
  const labels = formatPrecipitationWindowLabel("Now", 60);

  if (loading && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-white/72">Loading forecast...</p></WeatherWidgetFrame>;
  }

  if (error && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-rose-100">{error}</p></WeatherWidgetFrame>;
  }

  if (!data) return null;

  return (
    <WeatherWidgetFrame className="p-5 md:p-6" tone="storm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <WeatherSectionLabel>Next-Hour Precipitation</WeatherSectionLabel>
          <p className="mt-2 text-lg font-medium text-white">{data.precipitation.summary}</p>
        </div>
        <CloudRain className="h-5 w-5 text-white/80" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="grid grid-cols-16 items-end gap-1">
          {points.map((point) => (
            <div
              key={point.time}
              className="rounded-full bg-sky-300/90"
              style={{ height: `${Math.max(10, clampPercentage(point.intensity) * 0.72)}px`, opacity: Math.max(0.35, (point.probability ?? 0) / 100) }}
            />
          ))}
        </div>
        <WeatherDivider />
        <div className="flex justify-between text-sm text-white/56">
          <span>{labels.leadingLabel}</span>
          <span>{labels.trailingLabel}</span>
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
```

- [ ] **Step 2: Replace the hourly forecast card with a denser strip**

```tsx
import { WeatherWidgetFrame, WeatherSectionLabel } from "./WeatherWidgetFrame";
import { formatConditionLabel } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function HourlyForecastCard() {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-white/72">Loading hours...</p></WeatherWidgetFrame>;
  }

  if (error && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-rose-100">{error}</p></WeatherWidgetFrame>;
  }

  if (!data) return null;

  return (
    <WeatherWidgetFrame className="p-5 md:p-6" tone="cloud">
      <WeatherSectionLabel>Hourly Forecast</WeatherSectionLabel>
      <div className="mt-4 -mx-2 overflow-x-auto px-2 pb-1">
        <div className="flex min-w-max gap-3">
          {data.hourly.map((hour) => (
            <div className="flex w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-[1.4rem] bg-white/6 px-3 py-3 text-center ring-1 ring-white/8" key={hour.time}>
              <span className="text-xs text-white/60">{hour.label}</span>
              <span className="text-2xl font-light text-white">{Math.round(hour.temperatureC ?? 0)}°</span>
              <span className="line-clamp-2 text-[11px] leading-tight text-white/70">{formatConditionLabel(hour.conditionCode)}</span>
              <span className="text-xs text-sky-200/90">{Math.round(hour.probability ?? 0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </WeatherWidgetFrame>
  );
}
```

- [ ] **Step 3: Run typecheck after the precipitation/hourly rebuild**

Run: `npm run typecheck`

Expected: PASS.

## Task 6: Rebuild the 10-Day Forecast Widget and Run Full Verification

**Files:**
- Modify: `src/features/cards/weather/TenDayForecastCard.tsx`

- [ ] **Step 1: Replace the daily forecast rows with range-bar composition**

```tsx
import { WeatherWidgetFrame, WeatherSectionLabel } from "./WeatherWidgetFrame";
import { formatConditionLabel, getTemperatureRangeSegments } from "./weatherPresentation";
import { useWeatherData } from "./useWeatherData";

export function TenDayForecastCard() {
  const { data, error, loading } = useWeatherData();

  if (loading && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-white/72">Loading days...</p></WeatherWidgetFrame>;
  }

  if (error && !data) {
    return <WeatherWidgetFrame className="p-5"><p className="text-sm text-rose-100">{error}</p></WeatherWidgetFrame>;
  }

  if (!data) return null;

  return (
    <WeatherWidgetFrame className="p-5 md:p-6" tone="clear">
      <WeatherSectionLabel>10-Day Forecast</WeatherSectionLabel>
      <div className="mt-4 space-y-3">
        {data.daily.map((day) => {
          const range = getTemperatureRangeSegments(data.daily, day);
          return (
            <div className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3" key={day.date}>
              <span className="text-sm text-white/72">{day.label}</span>
              <div className="flex items-center gap-3">
                <span className="min-w-[7rem] text-sm text-white/68">{formatConditionLabel(day.conditionCode)}</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-white/12">
                  <div
                    className="absolute top-0 h-1.5 rounded-full bg-gradient-to-r from-sky-200 via-yellow-200 to-amber-300"
                    style={{ left: `${range.startPercent}%`, width: `${range.widthPercent}%` }}
                  />
                </div>
              </div>
              <span className="whitespace-nowrap text-sm text-white">{Math.round(day.lowC ?? 0)}° {Math.round(day.highC ?? 0)}°</span>
            </div>
          );
        })}
      </div>
    </WeatherWidgetFrame>
  );
}
```

- [ ] **Step 2: Run the focused presentation tests**

Run: `npm test -- tests/weatherCardPresentation.test.ts`

Expected: PASS.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Run full type and build verification**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS with the client and server builds completing successfully.

## Self-Review Notes

- Spec coverage: all five weather cards, shared styling, mixed widget sizing, viewport lock, data-boundary preservation, responsive constraints, and targeted testing are covered by Tasks 1 through 6.
- Placeholder scan: no `TODO`, `TBD`, or cross-task gaps remain.
- Type consistency: `WeatherWidgetFrame`, `WeatherSectionLabel`, `WeatherDivider`, and the `weatherPresentation.ts` helper names are used consistently across all tasks.
