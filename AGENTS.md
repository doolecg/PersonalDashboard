# AGENTS.md

## Trust These Sources First
- `SPEC.md` is stale in important ways. The shipped app uses Tailwind CSS v4, `@tailwindcss/vite`, shadcn config in `components.json`, and Geist in `src/styles/global.css`; do not follow the spec's "No Tailwind" rule.
- Styling changes can use SCSS when it is the clearest fit; do not assume this repo is limited to plain CSS because the spec says so.
- `README.md` is effectively empty. Prefer `package.json`, `server/*.ts`, `src/features/cards/README.md`, and the tests as source of truth.

## Commands
- `npm run dev` starts the only dev server: `tsx server/index.ts`. In development, Express mounts Vite middleware and serves the SPA on the same port.
- `npm run build` runs in this order: frontend TypeScript check/emit gate via `tsc -p tsconfig.json`, Vite build, then server compile via `tsc -p tsconfig.server.json`.
- `npm run start` serves the built frontend from `dist/` through `dist-server/index.js`.
- `npm run typecheck` checks both client and server tsconfigs.
- `npm test` runs Vitest once (`vitest run`).
- Focused test: `npm test -- tests/cardRegistry.test.ts`

## Runtime Shape
- This is one repo and one Node process, not separate frontend/backend apps.
- Server entrypoint: `server/index.ts`.
- Client entrypoint: `src/main.tsx`; app root is `src/App.tsx`.
- In production, Express serves `dist/`; in development, Vite runs in middleware mode inside Express.
- Browser code should call relative `/api/*` routes only. Current server routes are under `/api/ai`, `/api/log`, and `/api/healthz`.

## AI Wiring
- Server env is loaded only through `dotenv.config()` in `server/env.ts`; provider secrets belong in `.env`, never in client code.
- `.env.example` documents the supported provider variables: OpenRouter, OpenAI, Gemini, Ollama, and an OpenAI-compatible local endpoint.
- AI route entrypoint: `server/routes/ai.ts`.
- Provider routing/fallback logic lives in `server/providers/aiRuntime.ts`; provider interface is `server/providers/aiProvider.ts`; concrete adapters are in `server/adapters/`.
- Frontend AI consumers are `src/hooks/useAiStream.ts` for SSE chat streaming and `src/app/apiClient.ts` for status/mode calls.
- Streaming is SSE over `POST /api/ai/stream`; current implementation writes `token`, `done`, and `error` events.

## Dashboard Card Extension Points
- New dashboard UI should usually be added as a card under `src/features/cards/`.
- Follow `src/features/cards/README.md`: create `src/features/cards/<name>/<Name>Card.tsx`, keep card-specific logic beside it, wrap with `DashboardCard`, then register it in `src/features/cards/registry.ts`.
- `src/App.tsx` renders `CardGrid` from `cardRegistry`, so unregistered cards do not appear.

## Testing Notes
- Repo tests currently live in root `tests/` and import source modules directly.
- Existing coverage is lightweight and focused on pure logic (`tests/cardRegistry.test.ts`, `tests/aiGroundwork.test.ts`); if you change routing or UI wiring, add targeted tests instead of relying on broad existing coverage.

## Verified Gotchas
- `src/main.tsx` reports browser errors to `/api/log/client-error`; keep that endpoint working if you touch error/reporting flow.
- `server/routes/ai.ts` injects redacted dashboard context as a system message before provider calls; preserve that path if you refactor AI requests.
