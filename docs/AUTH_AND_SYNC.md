# Aura — Authentication, Supabase sync, and deployment

Aura is a personal dashboard intended to run behind a Cloudflare Tunnel (e.g.
on a Raspberry Pi). **Never expose it publicly without authentication.** In
production, auth is always enforced — `AUTH_ENABLED=false` is honoured only in
development.

## 1. Supabase setup

1. Create a project at https://supabase.com (free tier is fine).
2. In **SQL Editor**, run the migration: `supabase/migrations/001_aura_core.sql`.
   This creates the `aura_kv` table (user-scoped key/value storage for todos,
   notes, reminders, events, and assistant state) with Row Level Security.
3. In **Authentication → Providers**, enable **Email** (email/password).
   Optionally enable "Confirm email" — pair it with
   `AUTH_REQUIRE_EMAIL_VERIFICATION=true`.
4. In **Authentication → Users**, click **Add user** to create your account
   (or sign up once via the login screen if sign-ups are enabled).
5. From **Settings → API**, copy into `.env`:

   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-side ONLY
   AURA_STORAGE_DRIVER=supabase
   AUTH_ENABLED=true
   AUTH_ALLOWED_EMAILS=you@example.com
   ```

   The `VITE_` values are baked into the browser bundle at build time — they
   are public by design. The **service-role key must never** get a `VITE_`
   prefix or otherwise reach the frontend.

> Rebuild (`npm run build`) after changing `VITE_` values; they are compiled in.

## 2. How auth works

- The browser signs in with Supabase Auth (email/password) on the **AURA
  ACCESS** screen and attaches `Authorization: Bearer <access token>` to every
  `/api` call (see `src/app/http.ts`).
- The server verifies each token with Supabase (`server/auth/middleware.ts`),
  derives the user id from the *verified* token (never from the client), and
  enforces:
  - `AUTH_ALLOWED_EMAILS` — anyone else gets 403 *"This account is not
    authorised for this dashboard."*
  - `AUTH_REQUIRE_EMAIL_VERIFICATION` — unverified users get 403.
- Unauthenticated requests get 401; the UI shows the locked screen and never
  renders private data before the session check completes.
- Public routes: static assets, `/api/healthz`, `/api/auth/config`, the Google
  OAuth redirect (`/api/google/auth|callback`), and client error reporting.
- Sign out: Settings/System panel button, or `auth logout` in the terminal.

## 3. Cross-device sync

All user data is stored in `aura_kv` keyed by your Supabase user id, so the
same account sees the same data on every device:

| Data | Synced |
|---|---|
| Todos, notes, reminders, calendar events | Yes (server-backed) |
| Assistant suggestion dismissals/acceptance | Yes |
| AI provider keys / server config | Server-level (one per Aura host) |
| Display preferences, desktop window layout | Local to each browser |
| Terminal command history | Local-only by design (noise, no value in syncing) |

Writes go straight through to Supabase; other devices pick changes up on their
next load/refresh. Check sync from the Desktop **System** panel ("Sync now")
or the terminal: `sync status`, `sync now`, `storage status`.

If Supabase is unreachable the UI shows a calm degraded state and the server
reports `Sync: Degraded` — nothing crashes, and dev mode falls back to local
JSON.

## 4. Migrating existing local data

Existing `./data/*.json` collections can be imported into Supabase for your
user:

```bash
npm run migrate:supabase -- --email you@example.com
```

- Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
- The user must already exist in Supabase Auth.
- Collections that already contain Supabase data are skipped unless you pass
  `--force` (which overwrites them).

## 5. Local development mode

For development only, in `.env`:

```
AUTH_ENABLED=false
AURA_STORAGE_DRIVER=json
```

The app runs unauthenticated against local JSON under `./data` as a fixed
`local` user. This mode is refused in production (`NODE_ENV=production`
ignores `AUTH_ENABLED=false` and exits if Supabase auth is unconfigured).

## 6. Raspberry Pi / Cloudflare Tunnel notes

- Build on a faster machine if possible (`npm run build`), then run
  `NODE_ENV=production npm run start` on the Pi (Pi 3B works; all visual
  effects are static CSS — no backdrop-filter, no animated backgrounds).
- Token verifications are cached for 60 s server-side to keep Supabase round
  trips off the hot path.
- Recommended production env: `AUTH_ENABLED=true`, `AURA_STORAGE_DRIVER=supabase`,
  `AUTH_ALLOWED_EMAILS=<your email>`.
- Cloudflare Access could be layered in front later (`AUTH_PROVIDER` is
  structured for it) but is not implemented; Supabase Auth is the gate.

## 7. Terminal

The Desktop dashboard has a **Terminal** window. It runs *safe dashboard
commands only* — each maps to an existing API/feature; there is no OS shell
access. `help` lists everything; highlights: `status`, `calendar today`,
`todos`, `todo add <text>`, `assistant brief`, `ai status`, `auth status`,
`auth logout`, `storage status`, `sync now`, `logs errors`, `system info`.
Command history (↑/↓) is local-only.

## 8. Logs & AI provider behaviour

- Logs live in the Desktop **Logs** window (level filters, deduped entries) —
  not on the main dashboard.
- Repeated server-side errors are throttled: one entry per 10-minute window
  with a "repeated N times" summary. A missing AI key logs once as info, not
  as an error storm.
- With no AI provider configured: AURA Core's deterministic suggestions,
  terminal, weather, and all dashboards keep working; only natural chat and
  AI-written summaries degrade to fallbacks.

## 9. Obsidian

Not implemented in this pass — there was no existing integration and it would
not have been a clean fit. The storage driver and panel system are the
intended extension points if it's added later.
