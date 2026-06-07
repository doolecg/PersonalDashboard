# Weather Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship footprint-tuned weather typography, a more refined precipitation graph, clearer drag-and-drop feedback, and a development-only weather scenario toggle that can force rain, snow, thunder, and alert states across the weather cards.

**Architecture:** Keep the changes inside the existing weather card, weather data, and card grid seams. Add a small dev-scenarios module for full mock payloads, let `useWeatherData` own the scenario selection and shared weather payload, and keep drag feedback state local to `CardGrid` so layout persistence remains unchanged.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Vitest, native HTML drag-and-drop.

---

## File Map

- Modify: `src/features/cards/weather/WeatherCard.tsx`
  Responsibility: tune current-weather typography and small embedded hourly chip sizing per footprint.
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
  Responsibility: tune precipitation-card typography and graph spacing/opacity behavior.
- Modify: `src/features/cards/weather/useWeatherData.ts`
  Responsibility: keep shared weather state, add development-only scenario selection, and expose selector helpers.
- Create: `src/features/cards/weather/devWeatherScenarios.ts`
  Responsibility: define full `WeatherWidgetPayload` fixtures for clear, rain, snow, thunder, and alerts scenarios.
- Create: `src/features/cards/weather/WeatherDevPanel.tsx`
  Responsibility: render a small development-only scenario toggle UI that updates the shared weather scenario selection.
- Modify: `src/features/cards/weather/WeatherWidgetFrame.tsx`
  Responsibility: host the dev panel without changing production output.
- Modify: `src/features/cards/CardGrid.tsx`
  Responsibility: add active hover-slot state and clearer dragged-card styling during edit-mode reordering.
- Modify: `tests/weatherWidgetDensity.test.tsx`
  Responsibility: cover footprint-specific weather-card hierarchy decisions.
- Create: `tests/weatherDevMode.test.tsx`
  Responsibility: cover development scenario switching and fallback behavior in the weather data path.
- Create: `tests/cardGridDragFeedback.test.tsx`
  Responsibility: cover drag state visuals and hover-slot state transitions without end-to-end browser simulation.

### Task 1: Weather Typography And Precipitation Graph

**Files:**
- Modify: `src/features/cards/weather/WeatherCard.tsx`
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
- Test: `tests/weatherWidgetDensity.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrecipitationCard } from "../src/features/cards/weather/PrecipitationCard";
import { WeatherCard } from "../src/features/cards/weather/WeatherCard";
import type { WeatherWidgetPayload } from "../src/features/cards/weather/types";

const useWeatherDataMock = vi.fn();

vi.mock("../src/features/cards/weather/useWeatherData", () => ({
  useWeatherData: () => useWeatherDataMock()
}));

function buildWeatherPayload(): WeatherWidgetPayload {
  return {
    current: {
      location: "Birkenhead",
      temperatureC: 15,
      feelsLikeC: 14,
      conditionLabel: "Cloudy",
      conditionCode: "cloudy",
      highC: 18,
      lowC: 13,
      summary: "No precipitation expected in the next four hours."
    },
    precipitation: {
      summary: "Light rain beginning in 20 minutes.",
      points: Array.from({ length: 6 }, (_, index) => ({
        time: `2026-06-07T10:0${index}:00Z`,
        label: `${index * 10}m`,
        precipitationMm: index / 10,
        probability: index * 20,
        intensity: index * 15
      }))
    },
    hourly: Array.from({ length: 16 }, (_, index) => ({
      time: `2026-06-07T${String(index).padStart(2, "0")}:00:00Z`,
      label: `H${String(index).padStart(2, "0")}`,
      temperatureC: 15 + index,
      probability: index,
      conditionCode: "cloudy"
    })),
    daily: [],
    details: {},
    meta: {
      updatedAt: "2026-06-07T09:00:00Z",
      sourcesUsed: ["mock"]
    }
  };
}

describe("weather widget density", () => {
  beforeEach(() => {
    useWeatherDataMock.mockReturnValue({
      data: buildWeatherPayload(),
      error: null,
      loading: false,
      refresh: vi.fn()
    });
  });

  it("applies footprint-specific headline sizing in the current weather card", () => {
    const compact = renderToStaticMarkup(<WeatherCard footprint="1x1" />);
    const medium = renderToStaticMarkup(<WeatherCard footprint="2x1" />);
    const expanded = renderToStaticMarkup(<WeatherCard footprint="2x2" />);

    expect(compact).toContain("text-[2.5rem]");
    expect(medium).toContain("text-[3.35rem]");
    expect(expanded).toContain("text-[4.35rem]");
  });

  it("applies footprint-specific spacing and opacity polish in the precipitation graph", () => {
    const compact = renderToStaticMarkup(<PrecipitationCard footprint="2x1" />);
    const expanded = renderToStaticMarkup(<PrecipitationCard footprint="2x2" />);

    expect(compact).toContain("gap-[2px]");
    expect(expanded).toContain("gap-[4px]");
    expect(compact).toContain("opacity:0.22");
    expect(expanded).toContain("opacity:0.22");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/weatherWidgetDensity.test.tsx`
Expected: FAIL because the current cards still render the old text-size classes and old precipitation graph spacing/opacity.

- [ ] **Step 3: Write minimal implementation**

`src/features/cards/weather/WeatherCard.tsx`

```tsx
const temperatureScale = {
  "1x1": "text-[2.5rem]",
  "2x1": "text-[3.35rem]",
  "2x2": "text-[4.35rem]"
} as const;

const conditionScale = {
  "1x1": "text-[11px]",
  "2x1": "text-[12px]",
  "2x2": "text-[13px]"
} as const;

<p className={cn("font-light leading-none tracking-[-0.08em] text-white", temperatureScale[footprint])}>
  {Math.round(data.current.temperatureC)}°
</p>

<p className={cn("line-clamp-1 font-medium leading-4 text-white/88", conditionScale[footprint])}>
  {formatConditionLabel(data.current.conditionCode, data.current.conditionLabel)}
</p>
```

`src/features/cards/weather/PrecipitationCard.tsx`

```tsx
const graphGapClassName = isCompact ? "gap-[2px]" : "gap-[4px]";

function getPrecipitationBarOpacity(probability: number) {
  const normalized = Math.max(0, Math.min(probability / 100, 1));
  return Number((0.22 + normalized * 0.7).toFixed(2));
}

<div className={cn("grid items-end", graphGapClassName, isCompact ? "h-14" : "h-22 md:h-24")}
  style={{ gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(0, 1fr))` }}>
  {visiblePoints.map((point) => (
    <div key={point.time} className="flex h-full items-end">
      <div
        className="w-full rounded-full bg-sky-200/95"
        style={{
          height: `${Math.max(isCompact ? 4 : 6, clampPercentage(point.intensity) * 0.6)}px`,
          opacity: getPrecipitationBarOpacity(point.probability)
        }}
      />
    </div>
  ))}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/weatherWidgetDensity.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/weatherWidgetDensity.test.tsx src/features/cards/weather/WeatherCard.tsx src/features/cards/weather/PrecipitationCard.tsx
git commit -m "feat: polish weather card density"
```

### Task 2: Development Weather Scenario Mode

**Files:**
- Create: `src/features/cards/weather/devWeatherScenarios.ts`
- Create: `src/features/cards/weather/WeatherDevPanel.tsx`
- Modify: `src/features/cards/weather/useWeatherData.ts`
- Modify: `src/features/cards/weather/WeatherWidgetFrame.tsx`
- Test: `tests/weatherDevMode.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "../src/app/apiClient";

vi.mock("../src/app/apiClient", async () => {
  const actual = await vi.importActual<typeof import("../src/app/apiClient")>("../src/app/apiClient");
  return {
    ...actual,
    getWeatherData: vi.fn()
  };
});

describe("weather dev mode", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("returns a selected development scenario instead of live data", async () => {
    vi.stubEnv("DEV", "true");
    vi.mocked(apiClient.getWeatherData).mockResolvedValue({
      current: {
        location: "Live",
        temperatureC: 11,
        conditionLabel: "Live",
        conditionCode: "clear",
        summary: "live"
      },
      precipitation: { summary: "live", points: [] },
      hourly: [],
      daily: [],
      details: {},
      meta: { updatedAt: "2026-06-07T09:00:00Z", sourcesUsed: ["live"] }
    });

    const { setWeatherDevScenario, useWeatherData } = await import("../src/features/cards/weather/useWeatherData");

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const snapshots: Array<string | null> = [];

    function Probe() {
      const { data } = useWeatherData();
      snapshots.push(data?.current.location ?? null);
      return null;
    }

    await act(async () => {
      root.render(<Probe />);
    });

    await act(async () => {
      setWeatherDevScenario("thunder");
    });

    expect(snapshots).toContain("Thunder Point");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/weatherDevMode.test.tsx`
Expected: FAIL because the weather data hook does not yet expose dev scenario state or mock scenario payloads.

- [ ] **Step 3: Write minimal implementation**

`src/features/cards/weather/devWeatherScenarios.ts`

```ts
import type { WeatherWidgetPayload } from "./types";

export type WeatherDevScenario = "live" | "clear" | "rain" | "snow" | "thunder" | "alerts";

export const weatherDevScenarios: Record<Exclude<WeatherDevScenario, "live">, WeatherWidgetPayload> = {
  clear: { /* full clear payload */ },
  rain: { /* full rain payload */ },
  snow: { /* full snow payload */ },
  thunder: { /* full thunder payload */ },
  alerts: { /* full alerts payload */ }
};
```

`src/features/cards/weather/useWeatherData.ts`

```ts
import { weatherDevScenarios, type WeatherDevScenario } from "./devWeatherScenarios";

type WeatherState = {
  data: WeatherWidgetPayload | null;
  error: string | null;
  loading: boolean;
  scenario: WeatherDevScenario;
};

const weatherStore = {
  data: null,
  error: null,
  loading: true,
  promise: null,
  listeners: new Set<() => void>(),
  scenario: "live" as WeatherDevScenario
};

export function setWeatherDevScenario(nextScenario: WeatherDevScenario) {
  weatherStore.scenario = nextScenario;
  emitWeatherChange();
}

function getScenarioData() {
  if (!import.meta.env.DEV || weatherStore.scenario === "live") {
    return weatherStore.data;
  }
  return weatherDevScenarios[weatherStore.scenario];
}

return {
  ...state,
  data: getScenarioData(),
  scenario: weatherStore.scenario,
  setScenario: setWeatherDevScenario,
  refresh: async () => {
    weatherStore.promise = null;
    await loadWeather();
  }
};
```

`src/features/cards/weather/WeatherDevPanel.tsx`

```tsx
import { setWeatherDevScenario, useWeatherData } from "./useWeatherData";

export function WeatherDevPanel() {
  const { scenario } = useWeatherData();

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="absolute right-3 top-3 z-20 flex gap-1 rounded-full border border-white/12 bg-slate-950/60 p-1 backdrop-blur-xl">
      {(["live", "clear", "rain", "snow", "thunder", "alerts"] as const).map((option) => (
        <button
          className={option === scenario ? "rounded-full bg-white/18 px-2 py-1 text-[10px] text-white" : "rounded-full px-2 py-1 text-[10px] text-white/60"}
          key={option}
          onClick={() => setWeatherDevScenario(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
```

`src/features/cards/weather/WeatherWidgetFrame.tsx`

```tsx
import { WeatherDevPanel } from "./WeatherDevPanel";

<section className={cn(...)}>
  <WeatherDevPanel />
  <div className={cn("absolute inset-0 bg-gradient-to-br", toneClassName[tone])} />
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_42%)]" />
  <div className="relative flex h-full min-h-0 flex-col">{children}</div>
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/weatherDevMode.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/weatherDevMode.test.tsx src/features/cards/weather/devWeatherScenarios.ts src/features/cards/weather/WeatherDevPanel.tsx src/features/cards/weather/WeatherWidgetFrame.tsx src/features/cards/weather/useWeatherData.ts
git commit -m "feat: add weather dev scenarios"
```

### Task 3: Card Drag Feedback

**Files:**
- Modify: `src/features/cards/CardGrid.tsx`
- Test: `tests/cardGridDragFeedback.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardGrid } from "../src/features/cards/CardGrid";
import { cardRegistry } from "../src/features/cards/registry";

describe("card grid drag feedback", () => {
  it("highlights the current hover slot while a card is being dragged", () => {
    render(<CardGrid cards={cardRegistry} isEditing />);

    const dragHandle = screen.getAllByRole("button").find((node) => node.draggable);
    const slots = screen.getAllByRole("button").filter((node) => node.getAttribute("data-slot") === "true");

    if (!dragHandle || slots.length === 0) {
      throw new Error("Missing drag handle or slots");
    }

    fireEvent.dragStart(dragHandle);
    fireEvent.dragEnter(slots[0]);

    expect(slots[0].className).toContain("border-sky-200/55");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/cardGridDragFeedback.test.tsx`
Expected: FAIL because grid cells do not yet expose a hover-slot visual state.

- [ ] **Step 3: Write minimal implementation**

```tsx
const [activeSlot, setActiveSlot] = useState<{ column: number; row: number } | null>(null);

onDragEnter={() => {
  if (draggedCardId) {
    setActiveSlot({ column, row });
    moveCard(draggedCardId, column, row);
  }
}}

onDragEnd={() => {
  setDraggedCardId(null);
  setActiveSlot(null);
}}

className={cn(
  "rounded-[1.75rem] border border-dashed bg-white/[0.02] transition",
  activeSlot?.column === column && activeSlot?.row === row
    ? "border-sky-200/55 bg-sky-200/10 shadow-[0_0_0_1px_rgba(186,230,253,0.24)]"
    : "border-white/8 hover:bg-white/[0.04]"
)}

<div
  className={cn(
    "min-h-0 overflow-hidden will-change-transform transition-opacity duration-200",
    draggedCardId === id && "scale-[0.985] opacity-70 saturate-75"
  )}
  ...
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/cardGridDragFeedback.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/cardGridDragFeedback.test.tsx src/features/cards/CardGrid.tsx
git commit -m "feat: add card drag feedback"
```

### Task 4: Full Verification

**Files:**
- Test: `tests/weatherWidgetDensity.test.tsx`
- Test: `tests/weatherDevMode.test.tsx`
- Test: `tests/cardGridDragFeedback.test.tsx`

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/weatherWidgetDensity.test.tsx tests/weatherDevMode.test.tsx tests/cardGridDragFeedback.test.tsx`
Expected: PASS

- [ ] **Step 2: Run broader related coverage**

Run: `npm test -- tests/cardGridLayout.test.ts tests/weatherPresentation.test.ts tests/weatherNormalization.test.ts`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Review worktree**

Run: `git status --short`
Expected: Only intended plan implementation files are modified or added.

- [ ] **Step 5: Commit**

```bash
git add src/features/cards/CardGrid.tsx src/features/cards/weather/WeatherCard.tsx src/features/cards/weather/PrecipitationCard.tsx src/features/cards/weather/WeatherDevPanel.tsx src/features/cards/weather/WeatherWidgetFrame.tsx src/features/cards/weather/devWeatherScenarios.ts src/features/cards/weather/useWeatherData.ts tests/weatherWidgetDensity.test.tsx tests/weatherDevMode.test.tsx tests/cardGridDragFeedback.test.tsx
git commit -m "feat: polish weather cards and drag feedback"
```
