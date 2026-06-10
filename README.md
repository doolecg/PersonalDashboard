# Aura

A retro sci-fi personal dashboard — a secure, logged-in command system with a dim-CRT, phosphor-green visual language. Built with Vite + React 19 + TypeScript on the frontend and Express on the backend, served from a single origin — designed for a Raspberry Pi or PC behind a Cloudflare Tunnel.

> **Auth is required.** Aura uses Supabase for authentication and synced,
> user-scoped storage; the production build must not run without it. See
> [docs/AUTH_AND_SYNC.md](docs/AUTH_AND_SYNC.md) for setup, migration, and
> Cloudflare Tunnel guidance.

## Features

- **Required auth + cross-device sync**: Supabase Auth (AURA ACCESS login screen, allowed-email list, email verification) with all todos/notes/reminders/events/assistant state scoped to your user and consistent across devices
- **4 dashboards**: News, Weather, Productivity, Desktop
- **Desktop "machine room"**: working terminal (safe dashboard commands only), logs/diagnostics viewer with dedupe, auth/storage/sync/AI status panel, and the AURA Core proactive assistant
- **AURA Core**: deterministic proactive suggestions (daily brief, calendar gaps, back-to-back warnings, prep todos) — works without any AI provider; creating todos/reminders always requires your approval, and dismissals sync across devices
- **Weather**: Live ensemble forecast (Open-Meteo + Met.no), hourly rain graph, 10-day forecast, wind/UV/sun tiles, precipitation map
- **News**: TLDR newsletters (Tech/AI/Web Dev/DevOps), global headlines, science/space, tech news
- **Productivity**: Calendar (local + Google), to-dos, notes, reminders — all server-persisted and user-scoped
- **AI chat**: Multi-provider failover (OpenRouter → Gemini → OpenAI → local); tool-calling assistant that can create events, todos, and notes; missing providers degrade calmly (no error spam)
- **Preferences**: Location, display name, profile image, 24h clock, background/ticker toggle
- **Settings UI**: Runtime API key management, local-AI config, Google Calendar OAuth

## Requirements

- Node.js 20+
- At least one AI provider key (OpenRouter, OpenAI, or Gemini) — optional but needed for AI features

## Quick start (Linux / Raspberry Pi)

```bash
# 1. Install dependencies and build
bash install.sh

# 2. Edit .env with your API keys
nano .env

# 3. Run
bash run.sh
```

Open `http://localhost:8080` in your browser.

## Quick start (development)

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev            # http://localhost:8080
```

## Environment variables

Copy `.env.example` to `.env` and fill in what you need:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase auth in the browser (public, baked at build time) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase storage + token verification (**server-only**) |
| `AURA_STORAGE_DRIVER` | `supabase` (production) or `json` (dev fallback) |
| `AUTH_ENABLED` | `true` by default; `false` honoured only outside production |
| `AUTH_ALLOWED_EMAILS` | Comma-separated allow-list of sign-in emails |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Block unverified accounts (default `true`) |
| `OPENROUTER_API_KEY` | OpenRouter (free models available) |
| `OPENAI_API_KEY` | OpenAI — required for tool-calling assistant |
| `GEMINI_API_KEY` | Google Gemini |
| `ASSISTANT_MODEL` | Model for AI tool-calling (default: `openai/gpt-4o-mini`) |
| `OPENAI_COMPATIBLE_BASE_URL` | Local AI base URL (Ollama, llama.cpp) |
| `OPENAI_COMPATIBLE_MODEL` | Local AI model name |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Calendar OAuth |
| `PORT` | HTTP port (default: 8080) |

Runtime overrides (API keys, local-AI config) can also be edited in the Settings UI and are stored under `./data/` — they take precedence over `.env`.

## Commands

```bash
npm run dev        # Dev server (Express + Vite middleware on one port)
npm run build      # Production build -> dist/ and dist-server/
npm run start      # Serve the production build
npm run typecheck  # Type-check both frontend and backend
npm run test       # Run tests (Vitest)
```

## Linux package

```bash
bash scripts/make-package.sh
```

Produces `aura-<version>-linux.tar.gz` containing everything needed to deploy (no `node_modules`, no secrets). Extract on the target machine and run `bash install.sh` then `bash run.sh`.

## Data storage

User data (todos, notes, reminders, events, assistant state) lives in Supabase
(`aura_kv` table, user-scoped, RLS-protected) so it syncs across devices.
Migration from existing local files: `npm run migrate:supabase -- --email you@example.com`.

Server-level config stays as JSON under `./data/`:

- `secrets.json` — API key overrides (never returned in full via API)
- `server-config.json` — local-AI settings
- `google-tokens.json` — Google OAuth tokens

In development (`AURA_STORAGE_DRIVER=json`, `AUTH_ENABLED=false`) collections
fall back to local JSON files under `./data/` as before.

## Project structure

```
server/          Express backend (TypeScript, Node ESM)
src/             React frontend (TypeScript, Vite)
  app/           Shared state, API client, preferences, shell
  features/      Dashboards and cards
    dashboards/  news, weather, productivity, desktop views
    cards/       Reusable card components (calendar, weather, notes…)
tests/           Vitest tests (pure-logic focused)
data/            Runtime data (gitignored)
scripts/         Build and packaging scripts
```

## Adding a new card

1. Create `src/features/cards/<name>/<Name>Card.tsx`
2. Wrap it in `<DashboardCard>` (header, drag handle, footer)
3. Add a hook `src/features/cards/<name>/use<Name>Card.ts` for data
4. Register in `src/features/cards/registry.ts`
5. Add allowed footprints to `cardBehaviorConstants` in `src/constants/cards.ts`

## License

MIT
