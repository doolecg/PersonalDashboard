## Summary

This design covers four tightly related dashboard polish changes:

1. Tune weather-card text scale per footprint for a more Apple-like hierarchy.
2. Refine precipitation graph spacing and opacity.
3. Add clearer drag ghost and hover-slot feedback while editing card layout.
4. Add a development-only weather scenario mode with a UI toggle for richer weather states such as rain, snow, thunder, and alerts.

The implementation should follow the existing dashboard card architecture and avoid a broad refactor. The preferred approach is targeted polish inside the current weather card and card-grid seams.

## Goals

- Improve visual hierarchy in weather cards without changing their information model.
- Make the next-hour precipitation graph feel more intentional and legible.
- Make drag-and-drop editing clearer by showing both the dragged state and the current destination slot.
- Give development builds a simple way to force representative weather scenarios across all weather cards.

## Non-Goals

- No redesign of the overall shell or board layout.
- No new production weather API parameters or server routes.
- No replacement of the current drag-and-drop model with a custom pointer-driven system.
- No unrelated cleanup pass across all dashboard cards.

## Existing Context

- `src/features/cards/weather/WeatherCard.tsx` and `PrecipitationCard.tsx` currently encode footprint-specific text sizes inline with Tailwind classes.
- `src/features/cards/weather/useWeatherData.ts` owns client weather state and fetch behavior for all weather cards.
- `src/features/cards/CardGrid.tsx` drives edit-mode reordering with native drag events and currently has no dedicated hover-slot state.
- Current tests already cover some weather-card density rules and grid-layout behavior, but not the requested polish states.

## Recommended Approach

Implement the polish directly in the existing weather cards and grid component, using the current data flow and component boundaries.

This keeps the change set small and consistent with the repo:

- Weather typography remains local to weather card rendering.
- Precipitation graph polish remains local to `PrecipitationCard`.
- Drag feedback remains local to `CardGrid` and existing edit chrome.
- Dev scenarios are introduced in the weather data path so every weather card automatically reflects the chosen scenario.

## Design Details

### 1. Footprint-Specific Weather Typography

The current weather cards already branch on footprint, but the type choices are mostly ad hoc. The change should convert those choices into a deliberate per-footprint scale.

Primary targets:

- `WeatherCard`
- `PrecipitationCard`

Secondary target if needed for consistency:

- Small hourly chips rendered inside `WeatherCard`

Design intent:

- `1x1` current weather card: tighter labels, compact but still expressive temperature, reduced secondary copy pressure.
- `2x1` current weather card: more breathing room, stronger distinction between headline temperature and supporting text.
- `2x2` current weather card: largest and calmest hierarchy, with supporting hourly content scaled so it does not compete with the main value.
- `2x1` and `2x2` precipitation card: align temperature and summary sizing with the same hierarchy principles.

Implementation guidance:

- Prefer a small local footprint-to-class mapping object or constants block over repeated nested ternaries if it improves readability.
- Keep the change within the weather card files unless reuse is obvious and minimal.
- Preserve current content density decisions such as compact cards hiding longer summary text.

### 2. Precipitation Graph Polish

The current graph uses a fixed column gap and direct opacity mapping from probability. That produces a chart that is functional but visually flat.

The updated graph should:

- vary spacing slightly by footprint so compact graphs stay dense without feeling cramped
- use a smoother opacity floor and ceiling so tiny probabilities fade back and heavy precipitation feels more present
- keep a visible minimum bar height for dry or near-dry intervals without overstating them
- preserve the current time-window labeling model

Implementation guidance:

- Do not replace the bar graph with a line chart or SVG.
- Continue rendering from `data.precipitation.points`.
- Keep styling lightweight and local to the card.
- If height and opacity calculations become non-trivial, extract tiny pure helpers in the same file or in `weatherPresentation.ts` only if reused.

### 3. Drag Ghost And Hover-Slot Feedback

Current edit-mode drag behavior updates layout when the dragged card enters a background cell or another card, but the board does not clearly communicate the active destination.

The updated interaction should introduce two explicit visual states:

- Drag ghost state for the dragged card.
- Hover-slot state for the current destination cell.

Expected behavior:

- When dragging starts, the dragged card appears lifted or dimmed enough to read as in-motion while remaining recognizable.
- As the dragged card moves over editable grid cells, the active destination slot receives a stronger visual treatment than inactive cells.
- Reordering behavior remains based on the current native drag flow and existing `moveCard` logic.
- When dragging ends or is cancelled, both states clear immediately.

Implementation guidance:

- Add explicit hover-slot state in `CardGrid`, likely tracked as `column` and `row` for the active target.
- Reuse the existing edit-mode background cell buttons rather than introducing a second overlay system.
- Keep motion and transitions aligned with `motionConstants` and the current grid animation style.
- Avoid changing persistence behavior in `useCardLayout`.

### 4. Development-Only Weather Scenario Mode

Development builds need a way to expose weather-card edge cases and richer states without depending on live conditions.

This mode should:

- appear only in development
- provide a small UI toggle or selector for switching scenarios
- leave production behavior unchanged
- feed all weather cards through the same scenario payload once selected

Representative scenarios should include at minimum:

- clear/default
- rain
- snow
- thunder
- weather alerts

Scenario payloads should be full `WeatherWidgetPayload` variants, not patch objects, so each mode is explicit and easy to inspect.

Implementation guidance:

- Keep the scenario control client-side.
- Integrate the selected scenario inside `useWeatherData.ts` so card components remain unaware of dev-mode branching.
- The control can live near the weather widgets or in a lightweight developer-only affordance, but it should not ship in production output.
- If selection needs persistence during development, prefer local storage only if the implementation remains simple.

## Data Flow

Normal production flow:

1. `useWeatherData` fetches live weather from the existing client API path.
2. Weather cards render from the shared payload.

Development flow with scenario mode enabled:

1. A dev-only UI control updates the selected scenario.
2. `useWeatherData` resolves its output from the selected mock payload instead of the fetched live payload while the scenario is active.
3. All weather cards rerender from the same scenario payload.

The selected scenario should not require any server involvement.

## Error Handling

- Production fetch errors should continue to surface through existing weather card error states.
- Development scenario mode should not mask real production error handling code paths when no scenario is selected.
- If the dev selector is present, there should always be a clear path back to live data or default behavior.

## Testing Strategy

Follow TDD for implementation.

Expected test coverage:

- Weather card markup assertions for footprint-specific hierarchy decisions that can be verified through classes or rendered content boundaries.
- Precipitation card assertions for compact versus expanded graph rendering details where stable to test.
- Weather data tests for development scenario switching and production fallback behavior.
- Focused grid tests for drag feedback state if the logic can be covered without brittle full-browser drag simulation.

Test scope should stay focused on behavior. Avoid snapshot-heavy coverage for purely aesthetic differences unless there is a stable behavioral seam to assert.

## Risks And Mitigations

Risk: Typography tuning becomes scattered across multiple cards.
Mitigation: Use small local mappings per card and only extract shared helpers if reuse is real.

Risk: Drag feedback state can become noisy or stale.
Mitigation: Clear hover-slot and dragged-card state on all drag end paths and derive visuals from that single state.

Risk: Dev scenario mode leaks into production.
Mitigation: Gate the control and scenario behavior behind development checks only.

Risk: Tests overfit CSS details.
Mitigation: Assert meaningful rendering behavior and stable class decisions only where they represent intended logic.

## Implementation Boundaries

Likely touched files:

- `src/features/cards/weather/WeatherCard.tsx`
- `src/features/cards/weather/PrecipitationCard.tsx`
- `src/features/cards/weather/useWeatherData.ts`
- `src/features/cards/CardGrid.tsx`
- relevant weather and grid tests under `tests/`

Possible new files if they keep the change cleaner:

- a small dev-scenarios module under `src/features/cards/weather/`
- a focused test file for weather dev-mode behavior

## Decision Summary

- Use targeted in-place polish instead of a shared weather refactor.
- Keep the current native drag-and-drop model and add explicit visual state around it.
- Implement dev weather scenarios through a development-only UI toggle backed by full mock payloads in the client weather data layer.
