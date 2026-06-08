# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Aura" — a calm, Apple/visionOS-inspired personal dashboard. Vite + React 19 + TypeScript frontend, Express backend, served from a single origin (intended for Raspberry Pi / PC behind a Cloudflare Tunnel). `SPEC.md` is the original product brief; the codebase has since diverged from it (see "Reality vs. SPEC" below) — trust the code over the spec.

## Trust These Sources First

- **SPEC.md is stale.** The shipped app uses Tailwind CSS v4 (`@tailwindcss/vite`), shadcn config in `components.json`, and Geist typography. Do not follow the SPEC's "no Tailwind" rule or other structural guidance.
- **Styling:** SCSS is allowed when it's the clearest fit; do not assume the repo is CSS-only because the SPEC says so.
- **Source of truth:** `package.json`, `server/*.ts`, `src/features/cards/README.md`, and the tests are authoritative. The SPEC is reference only.

## Commands

```bash
npm run dev        # tsx server/index.ts — Express + Vite middleware on one port (default 8080)
npm run build      # tsc (web) + vite build -> dist/, then tsc -p tsconfig.server.json -> dist-server/
npm run start      # node dist-server/index.js (serves built dist/ in production)
npm run typecheck  # tsc --noEmit for BOTH web and server tsconfigs
npm run test       # vitest run (one-shot)
```

Run a single test: `npx vitest run tests/cardGridLayout.test.ts`
Watch a test: `npx vitest tests/cardGridLayout.test.ts`

There is **no lint step**. `npm run typecheck` is the correctness gate and must cover both tsconfigs. Dev runs everything on one process — there is no separate Vite dev server; Express embeds Vite in middleware mode (`server/index.ts`).

## Environment Setup

Copy `.env.example` to `.env` and fill in the provider keys you want to use:
- **AI providers:** `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` (at least one for AI features)
- **Local AI:** `OPENAI_COMPATIBLE_BASE_URL` + `OPENAI_COMPATIBLE_MODEL` (Ollama, llama.cpp, etc.)
- **Google Calendar:** `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (optional; enables OAuth flow)
- **Other:** `WEATHER_PROVIDER` (preset; don't change), `PORT` (default 8080)

Runtime overrides (secrets, local-AI config) can be edited in Settings UI and are persisted under `./data/` — they take precedence over `.env`. Rotating a key in the UI clears the override, falling back to `.env`.

## Architecture

Two TypeScript projects with separate configs, both `strict`:
- **`src/`** (`tsconfig.json`) — browser bundle. `moduleResolution: Bundler`, path alias `@/* -> src/*`. Imports use `@/...`.
- **`server/`** (`tsconfig.server.json`) — Node ESM. `moduleResolution: NodeNext`, so **relative imports must carry `.js` extensions** (e.g. `import { env } from "./env.js"`) even though the source is `.ts`. Match this convention.

### Backend (`server/`)
`server/index.ts` mounts routers under `/api`: `/api/shell`, `/api/ai`, `/api/weather`, `/api/log`, `/api/notes`, `/api/todos`, `/api/reminders`, `/api/settings`, `/api/google`, `/api/system`, plus `/api/healthz`. `/api/system/status` returns CPU usage (sampled over 120 ms), RAM, disk, host temp (Linux `/sys/class/thermal`), and NVIDIA GPU stats via `nvidia-smi` (gracefully absent on non-Linux/no-GPU hosts). In dev it attaches Vite middleware and serves `index.html`; in production it serves `dist/` static files with SPA fallback. On boot it awaits `applyStoredSecrets()` → `applyServerConfig()` → `applyStoredAiSelection()` to layer user-set overrides over `.env` before listening.

- **Config**: `server/env.ts` reads all env vars through `dotenv` into a single typed `env` object. Add new config here, never read `process.env` elsewhere. Note `env` is *mutable*: the runtime-override layer (below) writes back onto its fields.
- **Runtime overrides** (`server/secrets.ts`, `server/serverConfig.ts`): a subset of config can be edited at runtime from the Settings UI and is persisted to JSON under `env.dataDir` (`./data`), then layered over the `.env` defaults at startup. `secrets.ts` covers API keys (`openRouterApiKey`, `openAiApiKey`, `geminiApiKey`, `googleClientId`, `googleClientSecret`) — exposed only as masked status, never returned in full. `serverConfig.ts` covers non-secret local-AI settings (`localAiBaseUrl`/`localAiModel` → `openAiCompat*`). Both mutate `env` in place so adapters that read lazily pick up changes immediately; an empty value clears the override and reverts to `.env`. To make a new field user-editable, add it to `secretFields` or `configFields` — the `/api/settings` routes iterate those lists generically.
- **Persistence** (`server/store/collectionStore.ts`): there is no database. Small single-user data lives as JSON files under `env.dataDir` — list collections via `readCollection`/`writeCollection` (notes, todos, reminders) and single objects via `readObject`/`writeObject`/`deleteObject` (secrets, server-config, Google OAuth tokens). Writes are atomic (temp file + rename); collection names are charset-restricted to block path traversal.
- **Collections API** (`server/routes/collections.ts`): `createCollectionRouter(name)` builds an identical `GET /` (whole list) + `PUT /` (replace list wholesale) router; `notes`/`todos`/`reminders` are just three mounts of it. The client owns the list shape and round-trips it entirely.
- **Google Calendar** (`server/google/`, `server/routes/google.ts`): optional OAuth integration. `/api/google/auth` → consent redirect, `/callback` exchanges the code and stores tokens via the object store, `/status` reports configured/connected, `/events` lists upcoming calendar events. Gated on `googleClientId`/`googleClientSecret` (settable at runtime).
- **Weather** (`server/weather/`): an *ensemble* pipeline, not a single provider. `service.ts` fans out to three sources (Open-Meteo UKMO, Met.no, Open-Meteo ICON) via `Promise.allSettled`, normalizes each (`normalize.ts`), merges them (`ensemble.ts`), and shapes a `WeatherWidgetPayload` for the UI (`presentation.ts`). Results cached in-module for 5 minutes; falls back to stale cache on failure. `WEATHER_PROVIDER` env exists but the ensemble path is what runs. `GET /api/weather` accepts `lat`/`lon`/`city` query params (driven by user preferences). `GET /api/weather/geocode?q=` resolves place names via Open-Meteo geocoding (`geocode.ts`). `GET /api/weather/report` produces a short natural-language summary + a deterministic insight line (`report.ts`): it tries OpenAI and falls back to a generated string, cached per forecast refresh.
- **AI** has two distinct layers — don't conflate them:
  - *Routing/failover* (`server/providers/aiRuntime.ts` + `server/adapters/`): ordered failover across providers. `AI_ROUTING_MODE` (`auto|openrouter|gemini|openai|local`) selects the candidate list; `auto` tries all OpenRouter free models, then Gemini, OpenAI, then local (Ollama, llama.cpp). Tracks usage/token estimates in-module, exposed via `GET/PATCH /api/ai/status`. Backs `POST /api/ai/chat` and streaming `POST /api/ai/stream` (SSE `token`/`done`/`error` events).
  - *Tool-calling assistant* (`server/ai/assistant.ts` + `server/ai/tools/`): a separate OpenAI-only chat loop (`POST /api/ai/assistant`) that runs up to `maxToolRounds` of OpenAI function-calling against the tools in `tools/registry.ts` (currently `weatherTool`). To give the assistant a new capability, add an `AssistantTool` to that registry — no other wiring needed.
  - *Canned summaries* (`server/ai/newsSummary.ts`, `server/ai/lifeSummary.ts`): `GET /api/ai/news-summary` and `POST /api/ai/life-summary` (calendar events → a warm plain-language day summary). Both route through the failover runtime and fall back to a deterministic string when no provider is reachable.
  - Context is redacted before prompting in all paths (`server/ai/redactContext.ts`).

### Frontend (`src/`)
`src/App.tsx` switches between four **dashboards** (`src/features/dashboards/dashboards.ts`, ids `"news" | "weather" | "productivity" | "desktop"`, selected via nav/preferences). All four wrap their content in `<PlannerShell>` (`src/features/dashboards/planner/PlannerShell.tsx`), which provides the common chrome: full-bleed background image, header (greeting, weather pill, profile, nav), footer news ticker, and a slide-in AI chat sidebar.

- **news** (`NewsDashboard.tsx`): weather column + life summary + news summary panel.
- **weather** (`WeatherDashboard.tsx`): full-width hero, hourly precipitation strip, 10-day forecast, Windy.com map embed, bento detail tiles.
- **productivity** (`ProductivityDashboard.tsx`): weather + calendar + to-do + sticky notes in a column grid.
- **desktop** (`DesktopDashboard.tsx`): OS-style floating windows. Windows are defined in `panels.tsx` (host metrics, storage, network, mail, calendar, code, calculator, AI chat, external links); layout (position, size, visibility, z-order, snap state) managed by `useDesktopLayout.ts` and persisted to `localStorage`. A launcher dock toggles window visibility.

- **Card system** (`src/features/cards/`) — infrastructure exists (`CardGrid.tsx`, `registry.ts`, `DashboardCard.tsx`, individual card components) but is **not rendered by any active dashboard**. All current dashboards use bespoke column layouts inside `PlannerShell` instead. The card files remain for potential future reuse; do not treat them as the live UI layer.

- **`usePlannerEvents.ts`** merges local `localStorage` calendar events with read-only Google Calendar events when connected. Used by both the productivity calendar and the desktop calendar panel.
- **Module-level stores** — weather, preferences, and shell config use a shared pattern: a module-level store object with subscriber functions and React hooks that read via `useSyncExternalStore`. Example: `src/app/preferences/preferences.ts` exports `getPreferences()`, `setPreference()`, `subscribePreferences()`, used by the `usePreferences()` hook. This avoids Context overhead and ensures a single fetch even when many cards render. Do not create per-card stores; reuse existing patterns.
- **Weather cards** (`src/features/cards/weather/`) all read from one shared module-level store in `useWeatherData.ts` (single fetch, listener set) — not React Context. Don't add per-card fetches. The fetch is keyed off the user's selected location from preferences. The AI report/insight cards share `useWeatherReport.ts` similarly.
- **Calendar cards** (`src/features/cards/calendar/`): month view, upcoming events, and a large planner. Local events live in `localStorage` (`dashboard-calendar-events`) via `useCalendarEvents.ts`; `useGoogleEvents.ts` pulls read-only events from the Google Calendar backend when connected. There is no local calendar *write* backend — local events stay in the browser.
- **Notes / To-do / Reminders cards** (`src/features/cards/{notes,todo,reminders}/`): unlike calendar/weather, these **persist to the server** (`/api/{notes,todos,reminders}`) via `getCollection`/`save*` in `apiClient.ts` — load on mount, optimistic update, then `PUT` the whole list back. Server-backed, single-user, no per-card store.
- **Preferences** (`src/app/preferences/`): a module-level store (same pattern as weather — `getPreferences`/`setPreference`/`subscribePreferences`, consumed via `usePreferences()` with `useSyncExternalStore`) persisted to `localStorage` (`dashboard-preferences`). Holds display name, profile/background image, 24h clock, ticker/background visibility, selected `location`, and `defaultDashboard`. Edited through `src/features/settings/SettingsDialog.tsx` — which also surfaces server-side settings (API-key secrets, local-AI config, Google connect) via the `/api/settings` and `/api/google` routes.
- **Shell** (`src/app/shell/`): `useShellConfig` (user name + ticker from `/api/shell`), `useShellClock`, `useConnectionStatus`.
- **API calls:** Frontend talks only to relative `/api/*` routes via `src/app/apiClient.ts` — never directly to weather/AI providers or with absolute URLs. All API logic (routing, failover, redaction) lives on the backend.
- **Constants** (`src/constants/`): grid sizing, colors, fonts, motion, card behavior — barrel-exported from `index.ts`. Prefer these over magic numbers.
- **UI primitives** (`src/components/ui/`): shadcn-style `button`/`card` with `cn()` from `src/lib/utils.ts`. Tailwind v4 (via `@tailwindcss/vite`), dark mode forced (`className="dark"` on root). Note: the SPEC forbids `backdrop-filter` — glass is faked with layered gradients.

### Tests (`tests/`)
Vitest with jsdom-style React tests (`.test.tsx`) and pure-logic tests (`.test.ts`). Current coverage is lightweight and focused on pure logic:
- **Worth testing:** grid layout math, weather ensemble merge logic, normalization, news ticker generation, shell config parsing, collection store operations.
- **Not worth testing:** React component render trees, UI wiring, integration routes (trust the manual flow instead).
- **Pattern:** Extract logic-heavy code into pure functions in separate files (e.g., `gridLayout.ts`, `ensemble.ts`) and test those directly. Keep components thin and focused on UI. This makes both testing and refactoring straightforward.

## Reality vs. SPEC

`SPEC.md` describes a `widgets/`+`providers/` layout that **does not exist**. What's actually built: four named dashboards (`news`, `weather`, `productivity`, `desktop`) all sharing a `PlannerShell` chrome, weather end-to-end (including AI-written report/insight), calendar (local + optional Google), server-backed notes/todos/reminders, a preferences/settings system with runtime secret & config overrides, optional Google Calendar OAuth, the AI backend (routing + tool-calling assistant + canned summaries), and a system-status endpoint (CPU/RAM/disk/temp/GPU). A card-grid framework exists in `src/features/cards/` but is not wired to any dashboard. Default location is Birkenhead (lat 53.373, lon -3.016), not the SPEC's London.

## Security note

`.env` and `.env.example` currently contain real-looking secrets (OpenRouter + OpenAI keys). These should not be committed — `.env.example` must hold only placeholders, and any leaked keys should be rotated. Flag this if you touch those files.
