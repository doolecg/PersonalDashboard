You are a senior full-stack engineer, product designer, and systems architect.

Build “Aura” — a personal dashboard homepage using Vite + React + TypeScript.

Aura is a calm, Apple-inspired personal homepage/dashboard with a local-first architecture, provider-based data layer, and an AI assistant powered by OpenRouter, local Ollama, llama.cpp, LocalAI, or mock AI.

The finished project must be runnable immediately with mock data, and configurable later for real providers.

============================================================
PROJECT SUMMARY
============================================================

Build a single-page personal dashboard web app.

Stack:
- Vite
- React
- TypeScript
- Node backend using Express
- No heavy UI framework
- No Tailwind
- No Material UI
- No Chakra
- No Bootstrap
- Plain modern CSS with CSS custom properties
- Server-Sent Events for streaming AI responses
- localStorage for theme, notes, reminders, and manual finance data
- Clean provider interfaces for all real/mock data sources

Project name:
Aura

Primary deployment:
- Raspberry Pi 3 or PC serves Aura frontend + backend on one port.
- Cloudflare Tunnel exposes that single local Aura origin.
- The browser never talks directly to OpenRouter, Ollama, llama.cpp, LocalAI, weather APIs, or Phone Link.
- The browser only talks to Aura backend routes under /api.

Important:
- Do NOT expose raw local Ollama, llama.cpp, or LocalAI ports through Cloudflare.
- Do NOT put OpenRouter API keys in React.
- Do NOT put any provider secrets in the frontend bundle.
- The backend reads secrets from environment variables.

============================================================
OPENROUTER AI REQUIREMENTS
============================================================

Aura must support OpenRouter as the default hosted AI provider.

OpenRouter provider behavior:
- Backend calls:
  https://openrouter.ai/api/v1/chat/completions
- Use OpenAI-compatible request/response format.
- Use Authorization: Bearer OPENROUTER_API_KEY.
- Include optional app attribution headers:
  - HTTP-Referer: OPENROUTER_SITE_URL
  - X-OpenRouter-Title: OPENROUTER_APP_NAME
- Support streaming by sending stream: true.
- Convert OpenRouter stream chunks into Server-Sent Events from Aura backend to frontend.
- Default model:
  openrouter/free
- Allow switching to a specific free model:
  OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
- Handle 401, 402, 429, 500, timeout, and malformed stream errors gracefully.
- If OpenRouter fails and AI_FALLBACK_TO_MOCK=true, use MockAiProvider.
- Never crash a widget because AI fails.

AI provider options:
- mock
- openrouter
- ollama
- llamacpp
- localai
- openai-compatible

Default:
AI_PROVIDER=openrouter

Free/low-cost behavior:
- Cache morning briefing for at least 30 minutes.
- Cache unread message summaries until message data changes.
- Do not call AI every second.
- Do not call AI on every render.
- Use explicit refresh or provider data changes.
- Keep prompts compact.
- Use max_tokens around 500–900 for dashboard responses.

Privacy:
Before sending dashboard context to OpenRouter:
- Redact phone numbers.
- Redact email addresses.
- Redact account numbers.
- Redact transaction IDs.
- Avoid sending full message bodies unless user explicitly asks.
- Send message previews/summaries.
- Send note titles only unless user explicitly asks about note content.
- Send spending totals/categories instead of sensitive bank metadata.
- Support provider routing privacy controls:
  provider: {
    data_collection: "deny"
  }
- Optional high privacy:
  provider: {
    data_collection: "deny",
    zdr: true
  }
  but only use zdr when configured because it may reduce model availability.

Aura AI capabilities:
1. Summarize unread messages.
2. Generate a morning briefing from messages, calendar, spending, weather, reminders, and news.
3. Surface “what needs my attention today”.
4. Free-form chat from the Ask Aura input.
5. Stream responses.
6. Stay grounded in passed dashboard data.
7. Do not invent private data.
8. If data is missing, say it is unavailable.
9. Keep answers dashboard-friendly and concise.

============================================================
LOCAL AI REQUIREMENTS
============================================================

Aura must also support free local AI.

Local runtimes:
- Ollama
- llama.cpp OpenAI-compatible server
- LocalAI
- Mock provider fallback

Recommended local model defaults:
- Very low power: qwen3:0.6b or tinyllama
- Recommended default: qwen3:1.7b
- Better PC default: qwen3:4b
- Stronger PC: qwen3:8b or mistral
- Reasoning option: deepseek-r1-distill-qwen:1.5b or larger

Raspberry Pi 3 rule:
- Do not assume Raspberry Pi 3 can run a useful LLM.
- Pi 3 can serve Aura and run cloudflared.
- For AI, Pi 3 should call OpenRouter or a PC on the LAN running Ollama/llama.cpp/LocalAI.
- If AI host is unavailable, fall back to MockAiProvider.

============================================================
DESIGN AESTHETIC
============================================================

Create a calm Apple-inspired “liquid glass” / visionOS-style dashboard.

Overall look:
- Frosted translucent cards floating over a soft dusk scene.
- Background suggests mountains, sky gradient, dusk, and depth.
- Apple-blue accent: #0A84FF.
- White text in dark mode.
- Soft dark ink in light mode.
- Generous spacing.
- Airy, uncluttered layout.
- No emoji unless data-driven.
- Load “Onest” from Google Fonts.
- Use tight tracking around -0.005em.
- Big elegant numerals for clock and money.

Critical CSS rule:
Do NOT use backdrop-filter or -webkit-backdrop-filter anywhere.
Fake glass using:
- Layered translucent gradients.
- Soft blurred/low-contrast background.
- 1px translucent border.
- Soft drop shadow.
- Inset top highlight/specular sheen with pseudo-elements.

Design tokens:
- accent: #0A84FF
- blue: #0A84FF
- green: #30D158
- red: #FF375F
- orange: #FF9F0A
- indigo: #5E5CE6
- card radius: 26px
- card padding: 24px
- grid gap: 24px
- desktop outer padding: 52px
- dark ink: #fff
- dark dim: rgba(255,255,255,.66)
- dark faint: rgba(255,255,255,.42)

Dark glass:
background:
  linear-gradient(157deg, rgba(255,255,255,.16), rgba(255,255,255,.05)),
  linear-gradient(145deg, rgba(74,80,124,.5), rgba(34,38,70,.6))
border:
  1px solid rgba(255,255,255,.16)
shadow:
  soft large shadow
highlight:
  inset top sheen using ::before

Light glass:
background:
  translucent white gradients
border:
  rgba(255,255,255,.55)
shadow:
  subtle blue-gray shadow

============================================================
LAYOUT
============================================================

Responsive layout:
- Use a real CSS grid.
- Do not use a fixed-size scaled canvas.
- Desktop >= 1280px:
  - Header row.
  - 4-column widget grid.
  - Full-width breaking news ticker footer.
- Tablet:
  - 2 columns.
- Phone:
  - 1 column.
  - Reduced outer padding.
  - Header stacks cleanly.
  - Widgets remain usable with 44px hit targets.

Header:
- Left:
  - Greeting: “Good morning, {name}”
  - Big live clock, updates every second
  - 12-hour time with AM/PM
  - Long date, e.g. “Saturday, 6 June 2026”
- Right:
  - Weather pill: temperature, condition, city, high/low
  - Round avatar
  - Theme toggle

============================================================
WIDGETS
============================================================

1. Aura AI assistant hero card:
- Tall prime card.
- Sparkle/orb visual without emoji.
- “Briefing” badge.
- One-line greeting.
- 3–4 morning briefing bullets.
- “Needs a reply” mini-list using top 2 unread message threads.
- Each message has a real Reply button.
- Pinned input at bottom: “Ask Aura anything…”
- Submitting streams AI response.
- Graceful loading/error/fallback states.
- Mock briefing when AI unavailable.

2. Messages:
- AI one-line summary of unread texts.
- 3 most recent threads.
- Row includes:
  - avatar
  - name
  - preview
  - time
  - unread dot
- “3 new” pill or dynamic count.
- Uses messagesProvider.
- Mock provider first.
- Phone Link adapter stub later.
- Do not scrape private undocumented files.

3. Reminders:
- Checklist with completable circular buttons.
- Urgent items have small flag indicator.
- “Add a reminder…” row.
- Local CRUD persisted to localStorage:
  - create
  - complete/uncomplete
  - edit
  - delete

4. Health:
- Apple-style activity rings.
- Resting HR.
- Sleep.
- Steps.
- Progress bars:
  - Steps
  - Exercise
  - Stand
- Mock provider first.
- Respect prefers-reduced-motion.

5. Calendar Today:
- Time.
- Colored category bar.
- Title.
- Tag · duration.
- Provider interface for local ICS/device calendar.
- Mock provider first.
- Empty state when no events.

6. Spending:
- Today total.
- This-week total.
- 7-day bar chart using CSS or lightweight SVG.
- No charting library.
- Recent transactions:
  - category dot
  - name
  - category
  - amount
- Finance provider interface:
  - manual/local data now
  - CSV import-ready
  - bank API later
- Large money numerals.

7. Notes:
- Colored note cards with title + preview.
- “New note…” row.
- Full CRUD persisted locally.
- Calm minimal UI.

Footer:
- Breaking news ticker.
- “Breaking” pill.
- Horizontal feed:
  - source
  - headline
  - age
- Gently auto-scroll.
- Pause on hover/focus.
- Respect prefers-reduced-motion.

============================================================
DATA PROVIDERS
============================================================

All providers must:
- Return typed data.
- Have mock implementation.
- Have clean interface.
- Fail gracefully.
- Never crash widgets.
- Support loading, empty, error, and populated states.

Providers:
- messagesProvider
- weatherProvider
- calendarProvider
- financeProvider
- healthProvider
- remindersProvider
- notesProvider
- newsProvider
- aiProvider

Data models:
- MessageThread
- Reminder
- HealthSummary
- CalendarEvent
- Transaction
- Note
- WeatherSummary
- NewsHeadline
- MorningBriefing
- DashboardContext
- AiMessage
- AiRequest
- AiProvider

============================================================
WEATHER
============================================================

Weather provider:
- Mock weather by default.
- Open-Meteo adapter later.
- Use browser geolocation only through frontend consent.
- Backend accepts lat/lon query.
- Cache responses briefly.
- Manual default fallback:
  - DEFAULT_CITY
  - DEFAULT_LAT
  - DEFAULT_LON
- Never crash if unavailable.

============================================================
PHONE LINK
============================================================

Create phoneLinkProvider.stub.ts.

Rules:
- Implement messagesProvider shape.
- Return unavailable state unless enabled.
- Do not scrape private files.
- Do not rely on undocumented database paths.
- Comment that real integration should use a supported Windows notification bridge, export flow, or explicit user-authorized adapter.

============================================================
ACCESSIBILITY
============================================================

Requirements:
- Semantic HTML.
- Real buttons and inputs.
- aria-labels for icon-only buttons.
- Visible focus states.
- Keyboard navigable.
- 44px minimum hit targets.
- Sufficient contrast.
- prefers-reduced-motion respected.
- Ticker pauses on focus and hover.

============================================================
MOTION
============================================================

Use restrained motion:
- Card mount fade/slide.
- Ring fill animation.
- Subtle hover lift.
- No excessive movement.
- No gradient slop.
- Respect prefers-reduced-motion.

============================================================
PROJECT STRUCTURE
============================================================

aura/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  .env.example
  README.md
  cloudflared.example.yml
  systemd/
    aura.service
    cloudflared-aura.service
  server/
    index.ts
    env.ts
    types/
      models.ts
    routes/
      ai.ts
      weather.ts
      messages.ts
      calendar.ts
      finance.ts
      health.ts
      news.ts
      reminders.ts
      notes.ts
    providers/
      aiProvider.ts
      messagesProvider.ts
      weatherProvider.ts
      calendarProvider.ts
      financeProvider.ts
      healthProvider.ts
      newsProvider.ts
      localCrudProvider.ts
    adapters/
      mockAiProvider.ts
      openRouterProvider.ts
      ollamaProvider.ts
      llamaCppOpenAiProvider.ts
      localAiProvider.ts
      mockMessagesProvider.ts
      phoneLinkProvider.stub.ts
      openMeteoWeatherProvider.ts
      mockCalendarProvider.ts
      mockFinanceProvider.ts
      mockHealthProvider.ts
      mockNewsProvider.ts
    ai/
      promptBuilder.ts
      redactContext.ts
  src/
    main.tsx
    App.tsx
    types/
      models.ts
      providers.ts
    app/
      apiClient.ts
      theme.ts
      storage.ts
    hooks/
      useClock.ts
      useTheme.ts
      useDashboardData.ts
      useReducedMotion.ts
      useAiStream.ts
    components/
      GlassCard.tsx
      Header.tsx
      WeatherPill.tsx
      Avatar.tsx
      ProgressBar.tsx
      ActivityRings.tsx
      Skeleton.tsx
      EmptyState.tsx
      IconButton.tsx
    widgets/
      AuraWidget.tsx
      MessagesWidget.tsx
      RemindersWidget.tsx
      HealthWidget.tsx
      CalendarWidget.tsx
      SpendingWidget.tsx
      NotesWidget.tsx
      NewsTicker.tsx
    styles/
      tokens.css
      global.css
      layout.css
      glass.css
      motion.css

============================================================
ENVIRONMENT VARIABLES
============================================================

PORT=8080
NODE_ENV=development

DASHBOARD_NAME=Your Name
DEFAULT_CITY=London
DEFAULT_LAT=51.5072
DEFAULT_LON=-0.1276

AI_PROVIDER=openrouter
AI_FALLBACK_TO_MOCK=true
AI_TIMEOUT_MS=30000
AI_STREAM=true
AI_MAX_CONTEXT_CHARS=4000
AI_PRIVACY_MODE=high
AI_SUMMARY_CACHE_MINUTES=30

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=https://aura.example.com
OPENROUTER_APP_NAME=Aura

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:1.7b

OPENAI_COMPAT_BASE_URL=http://localhost:8081/v1
OPENAI_COMPAT_MODEL=local-model

WEATHER_PROVIDER=mock
NEWS_PROVIDER=mock

============================================================
BACKEND ROUTES
============================================================

Create these backend routes:
- GET /api/healthz
- GET /api/dashboard
- POST /api/ai/chat
- POST /api/ai/briefing
- POST /api/ai/message-summary
- POST /api/ai/stream
- GET /api/weather
- GET /api/messages
- GET /api/calendar/today
- GET /api/finance/summary
- GET /api/health
- GET /api/news
- CRUD routes for /api/reminders
- CRUD routes for /api/notes

AI streaming:
- Frontend sends POST /api/ai/stream.
- Backend returns text/event-stream.
- Emit:
  event: token
  data: {"token":"..."}

  event: done
  data: {}

On error:
  event: error
  data: {"message":"..."}

============================================================
FRONTEND REQUIREMENTS
============================================================

Frontend:
- Fetch dashboard data from /api/dashboard.
- Use provider response states.
- Use useAiStream for streamed chat.
- Use useClock for ticking clock.
- Use useTheme for persisted theme.
- Use useDashboardData for loading dashboard data.
- Use useReducedMotion.

Theme:
- Persist in localStorage.
- Default from prefers-color-scheme.
- Toggle dark/light.
- Use data-theme on document.documentElement.

============================================================
CLOUDFLARE DEPLOYMENT
============================================================

Production server:
- Serve Vite dist.
- Serve backend /api.
- One local origin:
  http://localhost:8080

Cloudflare Tunnel:
- Expose only Aura:
  aura.example.com -> http://localhost:8080
- Do not expose:
  - Ollama
  - llama.cpp
  - LocalAI
  - raw OpenRouter key
- README must recommend Cloudflare Access in front of the dashboard.

cloudflared.example.yml:
tunnel: aura
credentials-file: /home/pi/.cloudflared/aura.json
ingress:
  - hostname: aura.example.com
    service: http://localhost:8080
  - service: http_status:404

============================================================
SYSTEMD
============================================================

Provide:
- aura.service
- cloudflared-aura.service

Aura service:
- Runs npm run start or node dist-server/index.js.
- Restarts on failure.
- Loads .env.

Pi notes:
- Pi 3 can host the dashboard and tunnel.
- Pi 3 should use OpenRouter or call a PC LAN AI host.
- Do not rely on Pi 3 for heavy inference.

============================================================
README REQUIREMENTS
============================================================

Include:
- npm install
- npm run dev
- npm run build
- npm run start
- mock provider setup
- OpenRouter setup
- how to get and use an OpenRouter API key
- how to use openrouter/free
- how to use a specific :free model
- Ollama setup
- llama.cpp/OpenAI-compatible setup
- Raspberry Pi 3 deployment
- Cloudflare Tunnel setup
- Cloudflare Access recommendation
- troubleshooting:
  - OpenRouter 401
  - OpenRouter 429/rate limit
  - AI unavailable
  - weather unavailable
  - Cloudflare tunnel connected but API broken
  - frontend trying to call localhost incorrectly
  - CORS/origin issues

============================================================
ACCEPTANCE CRITERIA
============================================================

The app is accepted when:
- It renders immediately with mock data.
- Clock updates every second.
- Theme toggle persists.
- Responsive grid works on desktop/tablet/phone.
- No card uses backdrop-filter.
- All widgets have loading, empty, error, and populated states.
- Reminders and notes support local CRUD.
- Aura chat streams from MockAiProvider.
- Aura chat streams from OpenRouter when configured.
- OpenRouter key is server-only.
- OpenRouter failures fall back to mock when enabled.
- Cloudflare exposes only the Aura production origin.
- Code is clean, typed, strict, and organized.

============================================================
IMPLEMENTATION PLAN DECISIONS
============================================================

- Project location: repo root E:\CODING_PROJECTS\PersonalDashboard.
- Runtime: one Express origin serves /api and the Vite app.
- Default OpenRouter model: google/gemma-4-31b-it:free.
- No secrets committed; OPENROUTER_API_KEY belongs only in local .env.
- Mock providers must render immediately without real provider credentials.

