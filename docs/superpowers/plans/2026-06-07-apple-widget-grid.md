# Apple Widget Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current loose dashboard card sizing with an Apple-style widget footprint grid that behaves consistently on desktop and mobile and prevents cards from being cut off.

**Architecture:** Keep the existing card registry architecture, but replace `size` tokens with explicit footprint tokens and make `CardGrid.tsx` the single source of truth for row and column spans. Tighten the weather card internals to fit their assigned footprints instead of relying on oversized grid spans.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Vite

---

## File structure

- Modify: `src/features/cards/types.ts`
  Responsibility: define footprint tokens used by the registry and grid.
- Modify: `src/features/cards/registry.ts`
  Responsibility: map each registered card to an explicit footprint.
- Modify: `src/features/cards/CardGrid.tsx`
  Responsibility: convert footprints into responsive grid span classes and shared row sizing.
- Modify: `src/features/cards/weather/WeatherCard.tsx`
  Responsibility: tighten current-weather layout to fit a `2x2` tile without clipping.
- Modify: `src/features/cards/weather/WeatherWidgetFrame.tsx`
  Responsibility: ensure the weather surface stretches cleanly inside the new grid sizes.
- Modify: `src/features/cards/weather/HourlyForecastCard.tsx`
  Responsibility: verify the wide widget fits the `4x2` footprint.
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
  Responsibility: verify the large-square widget fits the `2x2` footprint.
- Modify: `src/features/cards/weather/TenDayForecastCard.tsx`
  Responsibility: verify the large-square widget fits the `2x2` footprint.
- Modify: `src/features/cards/weather/WeatherDetailsCard.tsx`
  Responsibility: tighten metrics so the card fits a `1x1` widget, or document the smallest necessary escalation.
- Modify: `tests/cardRegistry.test.ts`
  Responsibility: assert registry footprints stay valid.

### Task 1: Migrate card metadata to footprints

**Files:**
- Modify: `src/features/cards/types.ts`
- Modify: `src/features/cards/registry.ts`
- Test: `tests/cardRegistry.test.ts`

- [ ] **Step 1: Write the failing registry test**

```ts
import { describe, expect, it } from "vitest";
import { cardRegistry } from "../src/features/cards/registry";

describe("card registry", () => {
  it("keeps cards uniquely registered", () => {
    const ids = cardRegistry.map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(cardRegistry[0]?.Component).toBeTypeOf("function");
  });

  it("uses only supported widget footprints", () => {
    expect(cardRegistry.map((card) => card.footprint)).toEqual([
      "2x1",
      "2x2",
      "2x2",
      "4x2",
      "2x2",
      "1x1"
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/cardRegistry.test.ts`
Expected: FAIL because `footprint` does not exist yet.

- [ ] **Step 3: Write the minimal type and registry implementation**

```ts
export type CardFootprint = "1x1" | "2x1" | "2x2" | "1x2" | "4x2";

export type CardDefinition = {
  id: string;
  title: string;
  description?: string;
  footprint: CardFootprint;
  Component: ComponentType;
};
```

```ts
export const cardRegistry: CardDefinition[] = [
  { id: "example", title: "Base Card", description: "Reference card structure.", footprint: "2x1", Component: ExampleCard },
  { id: "weather-current", title: "Current Weather", description: "Current local conditions.", footprint: "2x2", Component: WeatherCard },
  { id: "weather-precipitation", title: "Precipitation", description: "Short-term rain outlook.", footprint: "2x2", Component: PrecipitationCard },
  { id: "weather-hourly", title: "Hourly Forecast", description: "24-hour temperature and precipitation.", footprint: "4x2", Component: HourlyForecastCard },
  { id: "weather-ten-day", title: "10-Day Forecast", description: "Longer daily outlook.", footprint: "2x2", Component: TenDayForecastCard },
  { id: "weather-details", title: "Weather Details", description: "Current weather metrics.", footprint: "1x1", Component: WeatherDetailsCard }
];
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- tests/cardRegistry.test.ts`
Expected: PASS.

### Task 2: Refactor the grid into a widget board

**Files:**
- Modify: `src/features/cards/CardGrid.tsx`

- [ ] **Step 1: Write the footprint mapping implementation**

```ts
const footprintClassName: Record<CardFootprint, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "2x2": "col-span-2 row-span-2",
  "1x2": "col-span-1 row-span-2",
  "4x2": "col-span-2 row-span-2 md:col-span-4"
};
```

```tsx
<section className="grid h-full w-full max-w-6xl min-h-0 auto-rows-[minmax(9.5rem,1fr)] grid-cols-2 gap-3 overflow-auto pb-1 md:auto-rows-[minmax(11rem,1fr)] md:grid-cols-4">
  {cards.map(({ Component, footprint, id }) => (
    <div className={cn("min-h-0 overflow-hidden", footprintClassName[footprint])} key={id}>
      <Component />
    </div>
  ))}
</section>
```

- [ ] **Step 2: Run typecheck for the grid refactor**

Run: `npm run typecheck`
Expected: PASS.

### Task 3: Tighten widget internals to fit their assigned footprints

**Files:**
- Modify: `src/features/cards/weather/WeatherCard.tsx`
- Modify: `src/features/cards/weather/HourlyForecastCard.tsx`
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
- Modify: `src/features/cards/weather/TenDayForecastCard.tsx`
- Modify: `src/features/cards/weather/WeatherDetailsCard.tsx`
- Modify: `src/features/cards/weather/WeatherWidgetFrame.tsx`

- [ ] **Step 1: Reduce oversized spacing and typography where content is clipping**

```tsx
<WeatherWidgetFrame className="p-5 md:p-6" tone="cloud">
```

```tsx
<p className="mt-2 text-[4rem] font-light leading-none tracking-[-0.06em] text-white md:text-[5rem]">
```

```tsx
<div className="flex items-end justify-between gap-3">
  <div className="min-w-0">
    ...
  </div>
  <p className="max-w-[11rem] text-right text-sm leading-5 text-white/68 md:max-w-[14rem]">...</p>
</div>
```

- [ ] **Step 2: Keep wide and metric widgets within their new footprints**

```tsx
<div className="grid h-full grid-cols-... gap-...">
```

```tsx
<div className="grid h-full content-start gap-3 text-sm">
```

Use the smallest spacing and label-density changes necessary to avoid clipping; do not add new layout abstractions.

- [ ] **Step 3: Run typecheck after the card tightening**

Run: `npm run typecheck`
Expected: PASS.

### Task 4: Full verification

**Files:**
- Modify: none unless verification exposes issues

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Run the app for manual verification**

Run: `npm run dev`
Expected: the Express/Vite server starts successfully.

- [ ] **Step 3: Validate the UI with available tooling**

Check that:

```text
- all cards align to the 2-column mobile and 4-column desktop widget board
- no weather widget text or charts are cut off
- the hourly forecast remains the intentional extra-wide widget
- the details card reads cleanly as a compact tile
```

If browser automation is unavailable in the current environment, record that limitation and rely on typecheck, tests, and the running dev server as the verification evidence.
