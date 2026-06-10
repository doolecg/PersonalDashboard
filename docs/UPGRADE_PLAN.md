# Aura Upgrade Plan — auth + Supabase sync + sci-fi redesign

Branch: `feature/auth-supabase-sci-fi-assistant-redesign`

This file is the persistent todo plan for the upgrade. Update checkboxes as work lands
so a later session can resume from here.

## What already exists (inspection summary, 2026-06-10)

- Express + Vite single origin (`server/index.ts`), **no auth anywhere**.
- Collections (`notes`, `todos`, `reminders`, `events`) are unauthenticated GET/PUT-whole-list
  routers (`server/routes/collections.ts`) over JSON files in `./data` (`server/store/collectionStore.ts`).
- All frontend fetches centralized in `src/app/apiClient.ts` (single place to add Bearer token).
- AI: failover runtime (`server/providers/aiRuntime.ts`), OpenAI tool-calling assistant
  (`server/ai/assistant.ts`), canned summaries. Logger is an in-memory ring buffer
  (`server/logger.ts`) exposed at `/api/log/recent`; no UI viewer, no dedupe.
- Desktop dashboard = floating windows defined in `src/features/dashboards/desktop/panels.tsx`
  (host/server/storage/utilities/calculator) → the "machine room" for new panels.
- Styling: Tailwind v4 + shadcn tokens (`src/styles/global.css`) + glassy blue theme
  (`planner.css`); background photo `src/assets/bg.png` with user override.
- No Supabase, no auth, no suggestions layer, no terminal. **Obsidian: deferred** — no existing
  support and it does not fit cleanly in this pass (documented as follow-up).

## Architecture decisions

- **Storage**: user-scoped KV (`aura_kv`) in Supabase, accessed server-side via service-role
  client. `StorageDriver` abstraction with `supabase` and `json` (dev fallback) drivers,
  selected by `AURA_STORAGE_DRIVER`. JSON driver namespaces per user under `./data/users/<id>`
  with legacy `./data/*.json` read for the dev local user.
- **Auth**: Supabase Auth on the frontend (`@supabase/supabase-js` anon client), backend
  verifies the Bearer access token via service client `auth.getUser(token)` (cached briefly),
  derives `userId`/`email`, enforces `AUTH_ALLOWED_EMAILS` + verification. Dev mode
  (`AUTH_ENABLED=false`, non-production only) uses a fixed `local` user.
- **Server-level config** (AI secrets, server config, Google OAuth tokens) stays in the local
  JSON object store — it is machine config, not user data.
- **Suggestions**: deterministic TypeScript engine server-side; stored via storage driver so
  dismissals sync across devices. AI only enhances wording when configured.
- **Theme**: additive `--aura-*` CSS variables + CRT background layers + restyled glass
  classes; existing layout/classes preserved (no component API breaks).

## Todo

- [x] 1. Supabase deps + env (`server/env.ts`, `server/supabase.ts`, `src/app/auth/supabaseClient.ts`)
- [x] 2. Server auth middleware + `/api/auth` routes; protect all private `/api/*`
- [x] 3. Storage driver (supabase + json) + user-scoped collections (incl. AI assistant tools)
- [x] 4. `supabase/migrations/001_aura_core.sql` + `npm run migrate:supabase` script
- [x] 5. Frontend auth store + AuthGate + AURA ACCESS login screen + Bearer token in apiClient
- [x] 6. Retro sci-fi theme (tokens, CRT background, panels, buttons; reduced-motion safe)
- [x] 7. Terminal panel (safe command registry, history, desktop window)
- [x] 8. Logs/diagnostics desktop area + logger dedupe + calm AI provider errors
- [x] 9. Proactive assistant suggestions (engine, endpoints, AURA Core panel)
- [x] 10. Docs (`docs/AUTH_AND_SYNC.md`, README) + `.env.example` + typecheck/build/tests + commit

All verified 2026-06-10: typecheck clean, 64/64 tests pass, production build OK,
smoke-tested dev mode (data + suggestions) and locked mode (401/503 + public
auth config).

## Known limitations / follow-ups

- Obsidian integration deferred (no existing support; keep optional per spec).
- Restaurant suggestions: structure + disabled state only unless `GOOGLE_MAPS_API_KEY` set.
- Terminal command history is local-only (documented; avoids syncing noisy data).
