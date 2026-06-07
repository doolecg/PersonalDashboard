## Goal

Align the dashboard with an Apple-style widget layout system so cards use a fixed set of modular footprints instead of ad hoc widths that cause clipping or oversized panels.

## Current Context

- The app renders cards through `src/features/cards/registry.ts` and `src/features/cards/CardGrid.tsx`.
- The current size model is `sm | md | lg | wide`.
- The current grid is a generic 4-column layout with span classes, which allows some cards to become visually much wider than the base card.
- Several weather cards rely on those larger spans, which creates cramped or cut-off internal layouts when the available height/width does not match the content density.

## Design Summary

Replace the current loose card sizing model with a widget footprint system based on one square base unit. Every card must map to an explicit footprint and render inside that footprint on both desktop and mobile.

The layout should feel like Apple widgets:

- consistent rounded tiles
- predictable modular sizing
- no arbitrary stretched widths
- large tiles are intentional `2x2` widgets, not generic oversized cards
- mobile keeps the same widget language instead of collapsing into unrelated full-width rows

## Widget Footprints

The grid will support these footprints:

- `1x1`: quarter square
- `2x1`: half-width horizontal widget
- `2x2`: large square widget
- `1x2`: tall widget for edge cases
- `4x2`: extra-wide feature widget for rare edge cases only

These names should be represented explicitly in code rather than inferred from vague size labels.

Recommended type shape:

```ts
type CardFootprint = "1x1" | "2x1" | "2x2" | "1x2" | "4x2";
```

## Grid Behavior

### Desktop

- Use a fixed modular grid with predictable column count.
- Base unit width should define the visual width of the smallest card.
- Larger widgets span multiple columns and rows from that same unit.
- Rows should be derived from the same base unit height so `2x2` tiles remain visually square.
- Grid gaps should stay tight and even to preserve the widget-board look.

Recommended desktop model:

- 4 columns
- one shared auto-row unit
- cards place themselves via `col-span-*` and `row-span-*`

### Mobile

- Keep the same widget model rather than flattening into generic stacked rectangles.
- Reduce to 2 columns.
- Preserve footprint semantics:
  - `1x1` remains a small square
  - `2x1` remains a half-width horizontal tile across both mobile columns
  - `2x2` remains a large square occupying the full mobile width and two row units
  - `1x2` remains a tall narrow tile when used
- Maintain square-based row sizing so the Apple-style proportions still read correctly.

## Card Mapping

Current registry entries should be remapped to explicit footprints.

Initial recommended mapping:

- `example`: `2x1`
- `weather-current`: `2x2`
- `weather-precipitation`: `2x2`
- `weather-hourly`: `4x2`
- `weather-ten-day`: `2x2`
- `weather-details`: `1x1`

Implementation should prefer the smallest footprint that preserves readability. If a card only works when oversized, the card content should be tightened before expanding the footprint. If `weather-details` proves too dense for `1x1`, the only allowed escalation is `1x2`.

## Component Changes

### `src/features/cards/types.ts`

- Replace `CardSize` with explicit footprint values.
- Update `CardDefinition` to use the new footprint property.

### `src/features/cards/registry.ts`

- Remap each card to a footprint.
- Keep registration structure unchanged otherwise.

### `src/features/cards/CardGrid.tsx`

- Replace the current simple span lookup with footprint-based column and row spans.
- Add a shared row-size strategy so cards preserve square relationships.
- Keep the implementation local and minimal; this file should remain the source of truth for footprint-to-class mapping.

### Individual card components

- Tighten typography and spacing where needed so content fits the assigned widget footprint.
- Prioritize weather cards because they currently use the largest spans and are the most likely source of clipping.
- Avoid introducing per-card width hacks; cards should fit because the system is correct.

## Content Fitting Rules

- No card should visually exceed its assigned footprint.
- Text blocks should use truncation, wrapping, and reduced max widths where needed.
- Large display temperatures and summaries must scale to fit the widget, especially in `1x1` and `2x1` footprints.
- Internal sections should be simplified if a footprint is too small for the current content density.

## Error Handling

- If a card has loading or error states, those states must also respect the same footprint.
- Loading and error content should not expand the card beyond its assigned size.

## Testing And Verification

Verify the redesign with:

- desktop rendering across all registered cards
- mobile rendering with the same widget footprint model
- no clipped text, charts, or icons in weather widgets
- correct registry rendering after the type migration
- successful `npm run typecheck`
- successful `npm test`

## Implementation Notes

- Keep the existing Tailwind-based stack.
- Do not rewrite the card architecture.
- Make the smallest system-level change that replaces the loose size model with a footprint model.
- Prefer footprint-driven layout fixes over one-off card CSS overrides.

## Recommended Implementation Order

1. Replace the size type with footprint values.
2. Update the registry to use footprints.
3. Refactor `CardGrid.tsx` to map footprints to row/column spans for desktop and mobile.
4. Tighten card internals where current content does not fit the new constraints.
5. Run typecheck and tests.
