# Shell Header and Footer Design

## Summary

Add a persistent application shell around the existing dashboard card grid.
The shell has:

- A header with the user name on the left
- Live local time, full date, and a settings control on the right
- A footer with a scrolling news ticker and a connection status pill

This design keeps shell configuration on the server side, sourced from `.env`, and exposed to the browser through a dedicated API route.

## Goals

- Add a reusable top-level shell without changing the card registration model
- Source visible shell content from server env configuration rather than hardcoded client values
- Keep time and date live on the client without server polling
- Show connection state clearly with a small persistent status pill
- Preserve the current single-process Express + Vite runtime shape

## Non-Goals

- Building a full settings panel
- Adding authenticated user state
- Fetching live news from a browser-side news API for this first pass
- Refactoring existing cards or card grid behavior beyond shell layout integration

## Recommended Approach

Use a dedicated shell config API backed by server env values.

Why this approach:

- It matches the repo's existing pattern of browser code calling relative `/api/*` routes
- It keeps `.env` access on the server, which is already the project convention
- It avoids coupling UI configuration to Vite-only `import.meta.env` behavior
- It leaves room to expand shell settings later without overloading health or AI routes

## Architecture

### App Layout

`src/App.tsx` becomes a three-row shell:

1. Header
2. Main dashboard content
3. Footer

The main dashboard content continues to render `CardGrid` from `cardRegistry`.

The root layout should use full viewport height and allocate space like this:

- Header: fixed-height top band
- Main: flexible content area for cards
- Footer: fixed-height bottom band

This keeps the dashboard readable while making the shell persistent.

### Server Surface

Add a dedicated route such as `GET /api/shell`.

The route returns a small JSON payload for shell display configuration, for example:

```json
{
  "userName": "Dayle",
  "tickerItems": [
    "BBC Merseyside: Headline one",
    "Wirral Globe: Headline two"
  ]
}
```

The payload should only include safe display data intended for the client.

### Env Configuration

Add shell-specific env keys and parse them in `server/env.ts`.

Required keys:

- `HEADER_USER_NAME`
- `FOOTER_TICKER_ITEMS`

Format:

- `HEADER_USER_NAME` is a plain string
- `FOOTER_TICKER_ITEMS` is a delimiter-separated string, using `||` between items

Example:

```env
HEADER_USER_NAME=Dayle
FOOTER_TICKER_ITEMS=Welcome back to Aura||Local rail delays easing this evening||Three tasks due before 18:00
```

`DASHBOARD_NAME` remains separate unless later intentionally merged.

## Component Design

### Header

Create a focused shell header component under a top-level app or layout area rather than as a dashboard card.

Behavior:

- Left side shows the configured user name
- Right side shows live time, full date, and a settings button

Display details:

- User name should read as a clear operator/profile label
- Time should update on an interval on the client
- Date should be formatted for readability in the same locale family as the time
- Settings button should be interactive but may use a placeholder click behavior in the first pass if no settings surface exists yet

The header should be visually lightweight so it frames the dashboard rather than competes with the cards.

### Footer

Create a focused shell footer component outside the card system.

Behavior:

- Show a continuously scrolling ticker from configured ticker items
- Show a connection status pill that reflects server reachability

Display details:

- Ticker should loop smoothly and remain readable on wide and narrow screens
- Status pill should be compact and always visible
- Footer should tolerate long ticker content with overflow-safe presentation

### Settings Control

The settings control should be a real button element for accessibility.

First-pass behavior options:

- Open a simple placeholder panel or modal if one already exists by implementation time
- Otherwise use a no-op or temporary action that does not imply missing business logic

The implementation plan should prefer the smallest correct interactive behavior already supported by the app.

## Data Flow

### Shell Config Flow

1. Browser requests `/api/shell` on app load
2. Server reads parsed env-backed config
3. Browser stores shell config in local component or hook state
4. Header and footer render from that config

### Time and Date Flow

1. Browser computes current local time and date
2. A client interval updates the display at a reasonable cadence
3. No server dependency is used for clock display

This avoids unnecessary server traffic and ensures the shell reflects the user's local runtime.

### Connection Status Flow

1. Browser polls `/api/healthz`
2. Successful responses map to an online state
3. Failed requests or non-ok responses map to an offline state
4. Footer pill updates its label and styling accordingly

Polling cadence should be conservative and lightweight.

## Error Handling and Fallbacks

### Shell Config Failures

If `/api/shell` fails:

- Render a safe fallback user label
- Render an empty ticker or minimal fallback ticker text
- Do not block the dashboard card grid from rendering

### Health Check Failures

If `/api/healthz` polling fails:

- Mark the connection pill as offline
- Continue polling on the normal interval
- Avoid noisy UI error states in the shell chrome

### Malformed Env Values

If `FOOTER_TICKER_ITEMS` is empty or malformed:

- Parse to an empty list after trimming invalid entries
- Keep footer layout intact
- Avoid throwing server-side errors for missing optional ticker content

## Styling Direction

The shell should align with the existing dark dashboard framing already present in `App`.

Design intent:

- Minimal, clean top and bottom rails
- Strong alignment and spacing
- Low visual noise so cards remain the primary content
- Clear contrast for time, date, and status information

The ticker motion should feel deliberate and steady, not flashy.

## Accessibility

- Use semantic landmarks where appropriate, such as `header` and `footer`
- Use a real `button` for settings
- Ensure the status pill uses text, not color alone, to convey state
- Keep time/date text legible at dashboard viewing distance
- Preserve keyboard access for any interactive shell control

## Testing Strategy

Add focused tests rather than broad integration coverage.

Recommended coverage:

- Server-side test for shell env parsing and route payload shape
- Client-side logic test for ticker item parsing or shell config normalization if extracted
- Client-side test for connection-state mapping if the polling logic is extracted into a hook

Testing should stay narrow and behavior-oriented.

## Implementation Boundaries

Likely files to touch:

- `src/App.tsx`
- `src/app/apiClient.ts`
- `server/env.ts`
- one new server route or route handler file for `/api/shell`
- one or more small shell components/hooks under `src/app/` or a similar top-level UI area
- `.env.example`
- targeted tests under `tests/`

This work should not require changes to card registration or existing card feature boundaries.

## Open Decisions Resolved For This Design

- Use a dedicated `/api/shell` route rather than `import.meta.env`
- Use `.env` as the source for user name and ticker content
- Keep time/date client-side and live
- Use `/api/healthz` polling for the connection status pill
- Keep header and footer outside the card system

## Success Criteria

- The dashboard renders with a persistent header and footer
- Header shows env-backed user name on the left
- Header shows live time, date, and settings control on the right
- Footer shows a readable scrolling ticker from env-backed items
- Footer shows a connection pill that reflects `/api/healthz` reachability
- If shell config fails, the dashboard still renders with safe fallbacks
