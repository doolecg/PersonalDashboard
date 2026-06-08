# Planner Dashboard Card Refresh Design

## Problem

1. LifeSummaryCard re-fetches all data (todos, reminders, news, AI summary) on tab refocus — wasteful and disruptive.
2. Summary, news, and chatbox have no dedicated manual refresh buttons — the user must hard-reload the page.
3. When the AI assistant modifies data through tool calls (`manage_todos`, `manage_notes`, `manage_calendar`), the affected cards don't know about it and show stale data until the next page load.

## Solution: Module-level Event Bus

A lightweight emit/subscribe module at `src/features/dashboards/planner/plannerEvents.ts`. Each card subscribes to its relevant events; the AiChatCard emits events when its tool calls modify data.

### Events

| Event | Emitted by | Consumed by |
|---|---|---|
| `todos-changed` | AiChatCard (after `manage_todos` tool call) | TodoGlassCard, LifeSummaryCard |
| `notes-changed` | AiChatCard (after `manage_notes` tool call) | StickyNotesCard, LifeSummaryCard |
| `events-changed` | AiChatCard (after `manage_calendar` tool call) | PlannerCalendarCard, LifeSummaryCard |
| `refresh-summary` | LifeSummaryCard's own button | LifeSummaryCard |
| `refresh-news` | LifeSummaryCard's own button | LifeSummaryCard |
| `refresh-chatbox` | AiChatCard's own button | AiChatCard |

### Module API

```typescript
type EventName = /* union of above */;
type Listener = () => void;

on(name: EventName, fn: Listener): () => void  // subscribe, returns unsubscribe
emit(name: EventName): void                     // publish
```

Same pattern as `useCalendarEvents`' module-level listener set. Returns an unsubscribe function for proper cleanup.

---

## Component Changes

### LifeSummaryCard (`src/features/dashboards/planner/LifeSummaryCard.tsx`)

**Remove:**
- The entire `focus` / `visibilitychange` listener block (lines 58-68)

**Add:**
- Subscribe to `todos-changed`, `notes-changed`, `events-changed` at mount — increment nonce to trigger data re-fetch + summary regeneration
- Subscribe to `refresh-summary` — increment nonce
- Subscribe to `refresh-news` — separate the news fetch from the todos/reminders fetch, so news can be refreshed independently

**News refresh implementation:**
- Split the existing single data-fetch effect into two:
  - Effect A: fetch todos + reminders (keyed by `dataNonce`)
  - Effect B: fetch news headlines only (keyed by `newsNonce`)
- Summary generation effect (Effect C) already watches the full payload signature, so it automatically re-generates when news updates
- Add a second `RefreshCw` button labeled "Refresh news" that increments `newsNonce`

### AiChatCard (`src/features/dashboards/planner/AiChatCard.tsx`)

**Existing behavior:** After `sendAssistantMessage`, the `toolCalls` array is returned but currently ignored.

**Add:**
- After `sendAssistantMessage` resolves successfully, inspect `result.toolCalls` and emit matching events:
  - `manage_todos` → `emit("todos-changed")`
  - `manage_notes` → `emit("notes-changed")`
  - `manage_calendar` → `emit("events-changed")`
- Add a **refresh context** button in the card header that re-fetches todos/reminders/notes by incrementing a nonce in the data-loading effect
- Subscribe to `refresh-chatbox` event as an alternative trigger

### TodoGlassCard (`src/features/dashboards/planner/TodoGlassCard.tsx`)

**Add:**
- Subscribe to `todos-changed` at mount — re-fetch todos from server via `getTodos()`
- Clean up subscription on unmount

### StickyNotesCard (`src/features/dashboards/planner/StickyNotesCard.tsx`)

**Add:**
- Subscribe to `notes-changed` at mount — re-fetch notes from server via `getNotes()`
- Clean up subscription on unmount

### PlannerCalendarCard (`src/features/dashboards/planner/PlannerCalendarCard.tsx`)

**Add:**
- Subscribe to `events-changed` at mount — call the new `refreshCalendarEvents()` from `useCalendarEvents`

### useCalendarEvents (`src/features/cards/calendar/useCalendarEvents.ts`)

**Add exported function:**
```typescript
export function refreshCalendarEvents() {
  inflight = null;
  events = [];
  ensureLoaded();
}
```

Resets the module-level store so the next subscriber triggers a fresh server fetch. Already-existing subscribers will be notified via `emit()` when `load()` completes and updates the `events` array.

---

## No Changes Required

- **WeatherTallCard** — weather data already has a `refresh()` method via `useWeatherData`; not in scope
- **PlannerDashboard** — no structural layout changes
- **Server code** — all logic is client-side
- **CardGrid / Home dashboard** — not affected
