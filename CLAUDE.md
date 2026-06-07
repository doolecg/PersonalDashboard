# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Aura" — a calm, Apple/visionOS-inspired personal dashboard. Vite + React 19 + TypeScript frontend, Express backend, served from a single origin (intended for Raspberry Pi / PC behind a Cloudflare Tunnel). `SPEC.md` is the original product brief; the codebase has since diverged from it (see "Reality vs. SPEC" below) — trust the code over the spec.

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

## Architecture

Two TypeScript projects with separate configs, both `strict`:
- **`src/`** (`tsconfig.json`) — browser bundle. `moduleResolution: Bundler`, path alias `@/* -> src/*`. Imports use `@/...`.
- **`server/`** (`tsconfig.server.json`) — Node ESM. `moduleResolution: NodeNext`, so **relative imports must carry `.js` extensions** (e.g. `import { env } from "./env.js"`) even though the source is `.ts`. Match this convention.

### Backend (`server/`)
`server/index.ts` mounts routers under `/api`: `/api/shell`, `/api/ai`, `/api/weather`, `/api/log`, plus `/api/healthz`. In dev it attaches Vite middleware and serves `index.html`; in production it serves `dist/` static files with SPA fallback.

- **Config**: `server/env.ts` reads all env vars through `dotenv` into a single typed `env` object. Add new config here, never read `process.env` elsewhere.
- **Weather** (`server/weather/`): an *ensemble* pipeline, not a single provider. `service.ts` fans out to three sources (Open-Meteo UKMO, Met.no, Open-Meteo ICON) via `Promise.allSettled`, normalizes each (`normalize.ts`), merges them (`ensemble.ts`), and shapes a `WeatherWidgetPayload` for the UI (`presentation.ts`). Results cached in-module for 5 minutes; falls back to stale cache on failure. `WEATHER_PROVIDER` env exists but the ensemble path is what runs. `GET /api/weather` accepts `lat`/`lon`/`city` query params (driven by user preferences). `GET /api/weather/geocode?q=` resolves place names via Open-Meteo geocoding (`geocode.ts`). `GET /api/weather/report` produces a short natural-language summary + a deterministic insight line (`report.ts`): it tries OpenAI and falls back to a generated string, cached per forecast refresh.
- **AI** has two distinct layers — don't conflate them:
  - *Routing/failover* (`server/providers/aiRuntime.ts` + `server/adapters/`): ordered failover across providers. `AI_ROUTING_MODE` (`auto|openrouter|gemini|openai|local`) selects the candidate list; `auto` tries all OpenRouter free models, then Gemini, OpenAI, then local (Ollama, llama.cpp). Tracks usage/token estimates in-module, exposed via `GET/PATCH /api/ai/status`. Backs `POST /api/ai/chat` and streaming `POST /api/ai/stream` (SSE `token`/`done`/`error` events).
  - *Tool-calling assistant* (`server/ai/assistant.ts` + `server/ai/tools/`): a separate OpenAI-only chat loop (`POST /api/ai/assistant`) that runs up to `maxToolRounds` of OpenAI function-calling against the tools in `tools/registry.ts` (currently `weatherTool`). To give the assistant a new capability, add an `AssistantTool` to that registry — no other wiring needed.
  - Context is redacted before prompting in both paths (`server/ai/redactContext.ts`).

### Frontend (`src/`)
`src/App.tsx` is the shell: background layer, `ShellHeader`, a centered `CardGrid`, and a `ShellFooter` ticker.

- **Card system** (`src/features/cards/`) is the core abstraction. `registry.ts` lists `CardDefinition`s (id, title, footprint, `Component`). `CardGrid.tsx` renders a real CSS grid with fixed-size square units, drag-to-reorder, resize, and FLIP reorder animations. `useCardLayout.ts` persists per-card position/footprint to `localStorage` (`dashboard-card-layout`) and merges saved layout over the registry via `gridLayout.ts`. Footprints are strings like `"1x1"`, `"2x1"`, `"4x4"`; allowed footprints per card live in `src/constants/cards.ts` (`cardBehaviorConstants`). To add a card: create the component, register it in `registry.ts`, and add its allowed footprints to `cardBehaviorConstants`.
- **Weather cards** (`src/features/cards/weather/`) all read from one shared module-level store in `useWeatherData.ts` (single fetch, listener set) — not React Context. Don't add per-card fetches. The fetch is keyed off the user's selected location from preferences. The AI report/insight cards share `useWeatherReport.ts` similarly.
- **Calendar cards** (`src/features/cards/calendar/`): month view, upcoming events, and a large planner. Events are stored locally in `localStorage` (`dashboard-calendar-events`) via `useCalendarEvents.ts` — there is no calendar backend.
- **Preferences** (`src/app/preferences/`): a module-level store (same pattern as weather — `getPreferences`/`setPreference`/`subscribePreferences`, consumed via `usePreferences()` with `useSyncExternalStore`) persisted to `localStorage` (`dashboard-preferences`). Holds display name, profile/background image, 24h clock, ticker/background visibility, and selected `location`. Edited through `src/features/settings/SettingsDialog.tsx`.
- **Shell** (`src/app/shell/`): `useShellConfig` (user name + ticker from `/api/shell`), `useShellClock`, `useConnectionStatus`. Frontend talks only to `/api/*` via `src/app/apiClient.ts` — never directly to weather/AI providers.
- **Constants** (`src/constants/`): grid sizing, colors, fonts, motion, card behavior — barrel-exported from `index.ts`. Prefer these over magic numbers.
- **UI primitives** (`src/components/ui/`): shadcn-style `button`/`card` with `cn()` from `src/lib/utils.ts`. Tailwind v4 (via `@tailwindcss/vite`), dark mode forced (`className="dark"` on root). Note: the SPEC forbids `backdrop-filter` — glass is faked with layered gradients.

### Tests (`tests/`)
Vitest with jsdom-style React tests (`.test.tsx`) and pure-logic tests (`.test.ts`). Logic-heavy modules (grid layout, ensemble merge, normalization, news ticker, shell config) are tested directly — keep that separation: put grid/weather/layout math in pure functions so they stay unit-testable apart from components.

## Reality vs. SPEC

`SPEC.md` describes many widgets (messages, reminders, health, spending, notes) and a `widgets/`+`providers/` layout that **do not exist yet**. What's actually built: the shell (header/clock/footer ticker), the card-grid framework, weather cards end-to-end (including AI-written report/insight cards), local-only calendar cards, a preferences/settings system, and the AI backend (routing + a tool-calling assistant). Default location is Birkenhead (lat 53.373, lon -3.016), not the SPEC's London.

## Security note

`.env` and `.env.example` currently contain real-looking secrets (OpenRouter + OpenAI keys). These should not be committed — `.env.example` must hold only placeholders, and any leaked keys should be rotated. Flag this if you touch those files.
