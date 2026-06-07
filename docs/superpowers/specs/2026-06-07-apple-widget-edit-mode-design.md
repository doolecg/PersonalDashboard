## Goal

Add an Apple-style editable widget board to the dashboard with a locked grid scale, adaptive card content, local layout persistence, and a constants system that remains compatible with the existing shadcn and Tailwind stack.

## Current Context

- The dashboard currently renders from `src/features/cards/registry.ts` into `src/features/cards/CardGrid.tsx`.
- Card footprints already exist (`1x1`, `2x1`, `2x2`, `1x2`, `4x2`).
- Board sizing is currently computed in `src/features/cards/gridLayout.ts` and rendered with inline CSS variables in `CardGrid.tsx`.
- Weather cards are already being tuned per footprint, but they do not yet have explicit adaptive presentation modes per size.
- There is no edit mode, no drag reorder, no resize UI, and no layout persistence beyond what is hardcoded in the registry.
- Local browser persistence utilities already exist in `src/app/storage.ts`.

## Design Summary

The dashboard should behave like an Apple home-screen widget board:

- one locked board scale per breakpoint
- no board scaling changes based on how many cards exist
- cards can enter an edit mode with jiggle animation
- a move handle appears in the card corner
- dragging a card causes other cards to move out of the way inside the grid
- cards can resize only to allowed preset footprints
- card internals adapt to the chosen footprint automatically
- the final layout is persisted to `localStorage`

The implementation must preserve the current UI stack:

- keep shadcn primitives
- keep Tailwind utility styling
- add app-owned constants and layout helpers above the library rather than replacing it

## Constants Layer

Create a new app-owned constants folder:

- `src/constants/colors.ts`
- `src/constants/fonts.ts`
- `src/constants/sizes.ts`
- `src/constants/motion.ts`
- `src/constants/grid.ts`
- `src/constants/cards.ts`
- `src/constants/index.ts`

These files are design and behavior tokens for the app, not replacements for shadcn theme internals.

### `src/constants/colors.ts`

Contains app widget tokens such as:

- widget border color
- widget glass color
- widget highlight overlay
- edit mode handle colors
- accent and status colors used by cards

### `src/constants/fonts.ts`

Contains type tokens such as:

- compact numeric sizes
- medium widget heading sizes
- large widget display sizes
- label and microcopy sizes

### `src/constants/sizes.ts`

Contains shared spatial tokens such as:

- widget radius
- widget padding by footprint
- icon sizes by footprint
- compact spacing values

### `src/constants/motion.ts`

Contains motion tokens such as:

- jiggle duration
- jiggle rotation amplitudes
- drag transition easing
- reorder spring timing

### `src/constants/grid.ts`

Contains the locked board configuration:

- mobile column count
- desktop column count
- widget unit size for mobile
- widget unit size for desktop
- widget gap
- board alignment rules
- allowed scale lock behavior

Important: the board scale is fixed by constants. It must not shrink or grow based on card count.

### `src/constants/cards.ts`

Contains per-card behavior rules such as:

- allowed footprints per card id
- default footprint per card id
- compact and expanded density settings
- hourly card visible-hour defaults
- visible-day limits for forecast cards

## Locked Grid Behavior

The board must stop deriving its scale from the number of cards on screen.

Instead:

- mobile uses a fixed column count and fixed unit size from constants
- desktop uses a fixed column count and fixed unit size from constants
- gaps are fixed from constants
- board scale is stable for a given breakpoint
- card count only affects placement, never board scale

If the user’s chosen layout no longer fits because of resize or reorder:

- the placement engine must repack cards into the next available open cells
- cards should move out of the way rather than forcing the board to rescale
- board scrolling remains disabled

If the chosen layout exceeds the available board space, the system should still repack deterministically within the fixed board dimensions and preserve the user’s card order as much as possible.

## Layout Model

The hardcoded registry order should no longer be the full source of truth for runtime layout.

Introduce a local persisted layout state with items shaped approximately like:

```ts
type PersistedCardLayout = {
  id: string;
  footprint: CardFootprint;
  order: number;
};
```

Runtime resolution order:

1. read persisted layout from `localStorage`
2. merge it with the registered cards
3. fall back to registry defaults for missing cards
4. ignore stale saved items for cards no longer registered

The registry remains the source of available cards and default footprints, but persisted layout becomes the source of current order and user-selected footprint.

## Edit Mode

Add an explicit edit mode to the dashboard.

In edit mode:

- cards jiggle lightly
- a move handle appears in a consistent corner
- a compact resize control becomes available
- dragging begins only from the move handle
- cards animate out of the way while hovering over a new slot
- dropping commits the new layout and saves it locally

Out of edit mode:

- no jiggle
- move and resize affordances are hidden
- cards behave as normal content widgets

### Dragging Behavior

Dragging should remain grid-based rather than freeform.

Rules:

- the dragged card keeps its footprint during drag unless the user explicitly resizes it
- potential placement resolves to grid cells
- non-dragged cards shift out of the way in response to the projected placement
- drop commits the reordered layout

This should feel like Apple widget editing rather than a canvas editor.

### Resizing Behavior

Cards can resize only to allowed preset footprints from `src/constants/cards.ts`.

Rules:

- each card exposes only its allowed sizes
- size changes are immediate inside edit mode
- resize triggers layout repack plus content adaptation
- invalid size choices must never be presented

## Card Adaptation Rules

Cards must adapt their internal presentation to footprint rather than attempting to squeeze one static layout into every size.

Each card should read its active footprint and choose compact, medium, or expanded content density accordingly.

### Current Weather Card

- `1x1`: location, icon, current temperature, short condition, high/low
- `2x1`: add stronger spacing and clearer labels
- `2x2`: may restore richer summary and supporting values

### Precipitation Card

- compact sizes reduce summary length and chart height
- medium and large sizes can show longer explanation and fuller chart spacing

### Hourly Forecast Card

- default visible content should emphasize about 12 hours
- internal content scrolls horizontally inside the card
- scrollbars must be visually hidden
- wheel, touchpad, touch, and drag-scroll should still work normally
- smaller footprints reduce visible labels, icon scale, and supporting text density
- larger footprints can show more columns or richer labels

### Ten-Day Forecast Card

- smaller footprints show fewer visible days
- condition labels shorten or truncate earlier
- temperature bar width and text scale shrink in compact mode

### Weather Details Card

- compact sizes prioritize the two or three most important values
- larger sizes can restore more secondary metrics

## Component Structure Changes

### `src/features/cards/CardGrid.tsx`

Responsibilities after redesign:

- render the fixed board from constants
- own edit-mode state or receive it from a parent shell control
- project drag targets and reorder responses
- render persisted layout order rather than registry order alone

### New layout helper module

Extend or split the current layout helpers so responsibilities stay focused:

- board metric helpers
- packing and repack helpers
- drag projection helpers
- persisted layout merge helpers

Avoid allowing `CardGrid.tsx` to become a single monolith for all layout logic.

### Card wrapper controls

Add a light widget-level control wrapper around cards to handle:

- move handle
- resize menu
- edit-mode chrome
- jiggle class application

This wrapper should compose around existing cards instead of forcing each card to implement drag UI individually.

## Persistence

Persist to local browser storage only.

Persist:

- card order
- selected footprint per card
- optionally edit-mode preference only if useful, but default behavior should not depend on persisted edit mode

Do not persist transient drag state.

## Library Compatibility

The redesign must not break the current component library usage.

Specifically:

- continue using shadcn primitives where already present
- continue using Tailwind utility classes
- use constants as app-level tokens feeding the existing component layer
- avoid replacing shadcn theme internals or introducing a parallel component system

The constants layer is an app-owned abstraction on top of the library, not a fork of the library.

## Testing And Verification

Add targeted tests for:

- persisted layout merge behavior
- repack logic after reorder and resize
- allowed footprint filtering per card
- fixed board metrics remaining stable regardless of card count
- card registry default layout behavior
- hourly card limiting default visible-hour presentation

Manual verification should confirm:

- board size stays locked when cards are added, removed, resized, or moved
- cards jiggle only in edit mode
- move handle appears correctly
- drag reorder pushes other cards out of the way
- resized cards adapt text, icon, and content density correctly
- hourly card shows a compact initial window and scrolls internally with hidden scrollbar

## Recommended Implementation Order

1. Add `src/constants/` and move hardcoded grid and visual tokens into it.
2. Refactor board sizing to use locked constants rather than card-count-driven scaling.
3. Add persisted layout state and merge it with the registry.
4. Add repack helpers for reorder and resize behavior.
5. Add edit mode, jiggle animation, move handle, and resize menu.
6. Make each card footprint-aware for content adaptation.
7. Tighten the hourly card to a 12-hour default internal scroller with hidden scrollbar.
8. Add focused tests and verify behavior manually.
