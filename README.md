# Aura

A calm, Apple/visionOS-inspired personal dashboard. Built with Vite + React 19 + TypeScript on the frontend and Express on the backend, served from a single origin — designed for a Raspberry Pi or PC behind a Cloudflare Tunnel.

## Features

- **4 dashboards**: News, Weather, Productivity, Desktop
- **Weather**: Live ensemble forecast (Open-Meteo + Met.no), hourly rain graph, 10-day forecast, wind/UV/sun tiles, precipitation map
- **News**: TLDR newsletters (Tech/AI/Web Dev/DevOps), global headlines, science/space, tech news
- **Productivity**: Calendar (local + Google), to-dos, notes, reminders — all server-persisted
- **AI chat**: Multi-provider failover (OpenRouter → Gemini → OpenAI → local); tool-calling assistant that can create events, todos, and notes
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

There is no database. All data is stored as JSON files under `./data/`:

- `notes.json`, `todos.json`, `reminders.json` — collections edited in the UI
- `secrets.json` — API key overrides (never returned in full via API)
- `google-tokens.json` — Google OAuth tokens

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
