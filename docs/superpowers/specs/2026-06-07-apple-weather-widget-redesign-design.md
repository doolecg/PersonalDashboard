# Apple Weather Widget Redesign

## Summary

Redesign the weather section so the full set of weather cards feels like a coordinated Apple Weather-inspired widget system instead of generic dashboard panels. Preserve the existing registry-based dashboard structure and existing weather data contracts, while changing the visual language, content hierarchy, and weather card composition.

## Goals

- Make the weather area feel visually closer to Apple Weather widgets shown in the provided references.
- Treat the weather cards as one unified widget family with shared styling and mixed card sizes.
- Preserve the existing weather data flow through `useWeatherData` and the current payload shape where possible.
- Improve the density and readability of current conditions, precipitation, hourly forecast, daily forecast, and detail metrics.
- Keep the full page locked to the browser viewport so the dashboard does not scroll vertically or horizontally.

## Non-Goals

- Rebuild the whole dashboard layout or shell around weather.
- Change backend weather provider logic or API contracts unless a small presentation helper becomes necessary.
- Apply the Apple Weather visual system to non-weather cards.

The no-scroll requirement allows minimal shell and grid sizing changes that are necessary to keep the page inside the viewport.

## Current Context

The repo already has a working weather card set:

- `WeatherCard` for current conditions
- `PrecipitationCard` for short-term rain outlook
- `HourlyForecastCard` for the next 24 hours
- `TenDayForecastCard` for daily outlook
- `WeatherDetailsCard` for secondary metrics

These cards all consume the shared `useWeatherData` hook and are registered independently in `src/features/cards/registry.ts`. The weather cards currently use the default `DashboardCard` shell and mostly generic inner layouts, which is the main visual gap against the Apple references.

## Design Direction

### Chosen Approach

Use a hybrid redesign:

- Keep the existing weather data flow and card registry structure.
- Restyle all weather cards as a coherent Apple Weather-inspired system.
- Recompose the weather area into a tighter mixed widget set with one hero card and supporting compact cards.

This gives a stronger Apple-style result than a surface-only reskin, while avoiding unnecessary server or app-shell changes.

### Visual Language

Weather cards should use a dedicated weather-specific surface style rather than the default dashboard card chrome.

Key traits:

- soft blue-gray atmospheric gradients
- subtle glass/frosted treatment with blur
- large rounded corners
- low-contrast borders and separators
- oversized temperature typography
- compact, muted supporting labels
- restrained icon use
- card-specific layouts instead of repeated header/content framing

The target feel is closer to native widget composition than to a generic analytics dashboard.

## Component Design

### WeatherCard

`WeatherCard` becomes the hero widget.

Content emphasis:

- location
- large current temperature
- condition summary
- daily high/low
- atmospheric backdrop

The layout should feel spacious and cinematic, with typography doing most of the work. The card should no longer look like a standard title/description panel.

### PrecipitationCard

`PrecipitationCard` becomes a more Apple-like rain module.

Content emphasis:

- near-term precipitation summary
- precipitation graph or bar-based visualization
- subtle gridlines and time labels
- supporting metrics only if they do not compete with the chart

The current graph can be retained conceptually, but it should be reworked to resemble a native widget more closely in spacing, shape language, and secondary labeling.

### HourlyForecastCard

`HourlyForecastCard` remains a horizontal forecast strip, but it should look smoother and denser.

Content emphasis:

- hour labels
- temperature rhythm
- compact condition indication
- precipitation probability when useful

The layout should avoid bulky boxed cells if they read too dashboard-like. The card should feel more like a native forecast rail.

### TenDayForecastCard

`TenDayForecastCard` becomes the densest forecast widget.

Content emphasis:

- day labels
- condition summary or compact condition indicator
- low/high temperatures
- Apple-style horizontal range bars for daily spread

This card should become more structured and legible than the current row list, with clearer visual hierarchy and more distinctive forecast bars.

### WeatherDetailsCard

`WeatherDetailsCard` becomes a compact supporting widget rather than a uniform grid of equal-weight tiles.

Content emphasis:

- selected secondary metrics such as humidity, wind, UV, visibility, or sunrise/sunset
- smaller Apple-like supporting layout
- tighter hierarchy with fewer competing boxes

It should feel like a support card paired with the hero and forecast widgets, not a separate dashboard metrics board.

## Shared Styling Strategy

Weather-specific shared styling may be introduced if it reduces duplication across cards.

Acceptable shared pieces:

- a weather widget surface class or wrapper
- small weather formatting helpers
- shared separator, label, or range-bar primitives

Avoid introducing abstraction unless it clearly reduces repetition across multiple weather cards.

## Data and Formatting

- Keep `useWeatherData` as the main client data source.
- Keep the existing `WeatherWidgetPayload` contract unless a small presentational helper is warranted.
- Derive display formatting in the card layer where possible.
- Preserve loading and error handling, but style those states so they still belong inside the weather widget language.

## Responsive Behavior

Keep weather as separate registered cards, but make them read visually as one collection.

Intended size roles:

- `WeatherCard`: hero widget
- `PrecipitationCard`: medium-to-large feature widget
- `HourlyForecastCard`: full-width strip
- `TenDayForecastCard`: large forecast widget
- `WeatherDetailsCard`: compact support widget

Desktop behavior:

- mixed card sizes should feel like a curated widget board
- weather cards should not read as identical modules in a uniform grid

Smaller-screen behavior:

- cards should stack cleanly
- large-temperature hierarchy should remain intact
- hourly and daily forecast content should remain readable without requiring brittle layouts

Viewport-fit behavior:

- the page should remain locked to the browser viewport with no horizontal or vertical scrolling
- the card grid must fit within the available space left by the shell header and footer
- weather cards should become denser where needed instead of causing the full page to overflow
- any internal horizontal overflow used for forecast strips should be removed or constrained so the overall page width never exceeds the viewport

## Testing Strategy

- Keep tests targeted to logic that changes.
- Add tests only where new helpers or derived display logic need coverage.
- Do not add broad UI snapshot coverage unless the repo already uses that pattern.
- Preserve existing weather data tests unless the redesign requires changing any shared presentational logic they cover.

## Risks and Mitigations

### Risk: generic card shell still leaks through

Mitigation: allow weather cards to bypass or customize the default `DashboardCard` framing where needed.

### Risk: over-abstracting shared weather UI too early

Mitigation: start with direct card-level composition and extract only repeated primitives that appear in multiple cards.

### Risk: desktop-first composition breaks on smaller screens

Mitigation: define clear card roles and keep each card independently readable when stacked.

### Risk: visual fidelity pushes unnecessary data-model changes

Mitigation: prefer presentation-layer formatting and reuse of the existing payload before changing server-side contracts.

## Implementation Boundary

The work should stay scoped to the weather section unless a minimal shared-card, shell, or grid sizing change is required to support the new visual system and viewport lock. Non-weather content should otherwise remain unchanged.
