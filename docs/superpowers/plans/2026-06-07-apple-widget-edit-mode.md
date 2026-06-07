# Apple Widget Edit Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locked-scale Apple-style widget board with local reorder and resize editing, adaptive card content, and an app-owned constants folder that stays compatible with shadcn and Tailwind.

**Architecture:** Move hardcoded widget tokens into `src/constants/`, keep the registry as the default source of available cards, and add a persisted layout layer for runtime order and footprint. Extend the grid with deterministic packing and edit-mode controls, then make the weather cards footprint-aware so their content adapts when resized.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest

---

## File structure

- Create: `src/constants/colors.ts`
  Responsibility: app-owned widget color and surface tokens.
- Create: `src/constants/fonts.ts`
  Responsibility: widget type scale tokens.
- Create: `src/constants/sizes.ts`
  Responsibility: spacing, radius, icon, and padding tokens.
- Create: `src/constants/motion.ts`
  Responsibility: jiggle and reorder motion tokens.
- Create: `src/constants/grid.ts`
  Responsibility: fixed board dimensions, gaps, and scale-lock tokens.
- Create: `src/constants/cards.ts`
  Responsibility: per-card allowed footprints and density presets.
- Create: `src/constants/index.ts`
  Responsibility: re-export constants.
- Modify: `src/features/cards/types.ts`
  Responsibility: add layout types for persisted order and adaptive footprints.
- Modify: `src/features/cards/registry.ts`
  Responsibility: provide default layout metadata that can merge with user state.
- Modify: `src/features/cards/gridLayout.ts`
  Responsibility: add layout merge, repack, and drop-projection helpers.
- Create: `src/features/cards/useCardLayout.ts`
  Responsibility: localStorage-backed runtime layout state, edit mode, reorder, and resize actions.
- Create: `src/features/cards/CardEditChrome.tsx`
  Responsibility: move handle, resize menu, and edit affordances.
- Modify: `src/features/cards/CardGrid.tsx`
  Responsibility: render locked board dimensions from constants and wire edit-mode layout behavior.
- Modify: `src/App.tsx`
  Responsibility: expose an edit-mode toggle in the shell and pass it into the widget board.
- Modify: `src/features/cards/weather/WeatherCard.tsx`
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
- Modify: `src/features/cards/weather/HourlyForecastCard.tsx`
- Modify: `src/features/cards/weather/TenDayForecastCard.tsx`
- Modify: `src/features/cards/weather/WeatherDetailsCard.tsx`
  Responsibility: adapt layout density to active footprint.
- Create: `tests/cardLayoutState.test.ts`
  Responsibility: test layout merge, resize rules, and repack behavior.
- Modify: `tests/cardGridLayout.test.ts`
  Responsibility: verify fixed board metrics stay stable regardless of card count.
- Modify: `tests/cardRegistry.test.ts`
  Responsibility: verify default footprint metadata and allowed-size behavior.

### Task 1: Add constants without replacing the library

**Files:**
- Create: `src/constants/colors.ts`
- Create: `src/constants/fonts.ts`
- Create: `src/constants/sizes.ts`
- Create: `src/constants/motion.ts`
- Create: `src/constants/grid.ts`
- Create: `src/constants/cards.ts`
- Create: `src/constants/index.ts`

- [ ] **Step 1: Create the constants modules**

```ts
export const gridConstants = {
  mobileColumns: 4,
  desktopColumns: 6,
  mobileUnit: 110,
  desktopUnit: 146,
  gapPx: 12,
  lockScale: true
} as const;
```

```ts
export const cardBehaviorConstants = {
  "weather-current": { allowedFootprints: ["1x1", "2x1", "2x2"] as const },
  "weather-precipitation": { allowedFootprints: ["2x1", "2x2"] as const },
  "weather-hourly": { allowedFootprints: ["2x1", "2x2", "4x2"] as const, defaultVisibleHours: 12 },
  "weather-ten-day": { allowedFootprints: ["1x1", "2x1", "2x2"] as const },
  "weather-details": { allowedFootprints: ["1x1", "1x2", "2x1"] as const }
} as const;
```

- [ ] **Step 2: Export a single constants entrypoint**

```ts
export * from "./cards";
export * from "./colors";
export * from "./fonts";
export * from "./grid";
export * from "./motion";
export * from "./sizes";
```

- [ ] **Step 3: Run typecheck for the constants layer**

Run: `npm run typecheck`
Expected: PASS.

### Task 2: Add layout state and repack helpers

**Files:**
- Modify: `src/features/cards/types.ts`
- Modify: `src/features/cards/gridLayout.ts`
- Create: `src/features/cards/useCardLayout.ts`
- Create: `tests/cardLayoutState.test.ts`

- [ ] **Step 1: Write the failing layout-state test**

```ts
it("merges saved layout with registry defaults and repacks resized cards", () => {
  const result = mergeCardLayout(registryCards, [
    { id: "weather-current", footprint: "2x2", order: 3 },
    { id: "weather-hourly", footprint: "4x2", order: 0 }
  ]);

  expect(result[0]?.id).toBe("weather-hourly");
  expect(result.find((card) => card.id === "weather-current")?.footprint).toBe("2x2");
  expect(getBoardRowCount(result, 6)).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/cardLayoutState.test.ts`
Expected: FAIL because merge and persisted layout helpers do not exist yet.

- [ ] **Step 3: Add the minimal layout types and helpers**

```ts
export type PersistedCardLayout = {
  id: string;
  footprint: CardFootprint;
  order: number;
};

export type RuntimeCardLayout = CardDefinition & PersistedCardLayout;
```

```ts
export function mergeCardLayout(cards: CardDefinition[], saved: PersistedCardLayout[]): RuntimeCardLayout[] {
  const savedById = new Map(saved.map((entry) => [entry.id, entry]));

  return cards
    .map((card, index) => {
      const savedEntry = savedById.get(card.id);

      return {
        ...card,
        footprint: savedEntry?.footprint ?? card.footprint,
        order: savedEntry?.order ?? index
      };
    })
    .sort((left, right) => left.order - right.order);
}
```

```ts
const STORAGE_KEY = "dashboard-card-layout";
```

- [ ] **Step 4: Run the focused layout-state test**

Run: `npm test -- tests/cardLayoutState.test.ts`
Expected: PASS.

### Task 3: Lock board scale and keep it independent of card count

**Files:**
- Modify: `src/features/cards/gridLayout.ts`
- Modify: `src/features/cards/CardGrid.tsx`
- Modify: `tests/cardGridLayout.test.ts`

- [ ] **Step 1: Write the failing fixed-scale test**

```ts
it("uses the configured widget unit instead of shrinking from card count", () => {
  expect(
    getWidgetBoardMetrics({
      availableHeight: 900,
      availableWidth: 1400,
      columnCount: 6,
      gap: 12,
      rowCount: 4,
      lockedUnit: 146
    })
  ).toEqual({
    boardHeight: 620,
    boardWidth: 936,
    unitSize: 146
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/cardGridLayout.test.ts`
Expected: FAIL because `lockedUnit` is not supported yet.

- [ ] **Step 3: Implement locked-unit board metrics and consume constants in the grid**

```ts
export function getWidgetBoardMetrics({ columnCount, gap, lockedUnit, rowCount }: FixedBoardMetricsOptions): WidgetBoardMetrics {
  const unitSize = lockedUnit;

  return {
    boardHeight: unitSize * rowCount + gap * (rowCount - 1),
    boardWidth: unitSize * columnCount + gap * (columnCount - 1),
    unitSize
  };
}
```

```tsx
const mobileMetrics = getWidgetBoardMetrics({ columnCount: gridConstants.mobileColumns, gap: gridConstants.gapPx, lockedUnit: gridConstants.mobileUnit, rowCount: mobileRowCount });
const desktopMetrics = getWidgetBoardMetrics({ columnCount: gridConstants.desktopColumns, gap: gridConstants.gapPx, lockedUnit: gridConstants.desktopUnit, rowCount: desktopRowCount });
```

- [ ] **Step 4: Run the focused grid test and typecheck**

Run: `npm test -- tests/cardGridLayout.test.ts`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

### Task 4: Add edit mode, move handle, and resize menu

**Files:**
- Create: `src/features/cards/CardEditChrome.tsx`
- Create: `src/features/cards/useCardLayout.ts`
- Modify: `src/features/cards/CardGrid.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add a shell-level edit-mode toggle**

```tsx
const [isEditingCards, setIsEditingCards] = useState(false);
```

```tsx
<CardGrid cards={cardRegistry} isEditing={isEditingCards} onEditingChange={setIsEditingCards} />
```

- [ ] **Step 2: Add edit chrome for move and resize controls**

```tsx
<button aria-label="Move card" data-card-move-handle type="button">...</button>
<button aria-label="Resize card" type="button">...</button>
```

- [ ] **Step 3: Wire drag, reorder, and resize actions through `useCardLayout`**

```ts
const { cards, moveCard, resizeCard } = useCardLayout({ cards: registryCards });
```

- [ ] **Step 4: Run typecheck after the edit-mode wiring**

Run: `npm run typecheck`
Expected: PASS.

### Task 5: Make weather cards footprint-aware

**Files:**
- Modify: `src/features/cards/weather/WeatherCard.tsx`
- Modify: `src/features/cards/weather/PrecipitationCard.tsx`
- Modify: `src/features/cards/weather/HourlyForecastCard.tsx`
- Modify: `src/features/cards/weather/TenDayForecastCard.tsx`
- Modify: `src/features/cards/weather/WeatherDetailsCard.tsx`

- [ ] **Step 1: Pass active footprint into card components from the grid wrapper**

```tsx
<Component footprint={footprint} />
```

- [ ] **Step 2: Add compact, medium, and expanded render branches where needed**

```tsx
const isCompact = footprint === "1x1";
const visibleHours = footprint === "4x2" ? 12 : footprint === "2x2" ? 10 : 8;
```

- [ ] **Step 3: Convert the hourly card to a 12-hour internal scroller with hidden scrollbars**

```tsx
const visibleHours = data.hourly.slice(0, 12);
```

```tsx
<div className="mt-3 flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
```

- [ ] **Step 4: Run weather-related tests and typecheck**

Run: `npm test -- tests/weatherCardPresentation.test.ts tests/weatherPresentation.test.ts`
Expected: PASS.

Run: `npm run typecheck`
Expected: PASS.

### Task 6: Full verification

**Files:**
- Modify: tests only if verification exposes missing assertions

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Run a full typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Verify the interactive board manually**

Check:

```text
- board size stays fixed when card order or size changes
- edit mode shows jiggle and move handle
- drag reorder pushes neighboring cards out of the way
- resizing only offers allowed footprints
- weather card content adapts when footprint changes
- hourly card shows a compact visible window and scrolls internally without visible scrollbars
```

If browser automation is unavailable, record that limitation and rely on tests plus the running dev server for verification evidence.
