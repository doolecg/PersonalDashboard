# Shell Header and Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-level dashboard shell with an env-backed header and footer, including a live clock, scrolling ticker, and `/api/healthz` connection pill.

**Architecture:** Keep shell configuration on the server with a dedicated `/api/shell` route, expose only safe display fields to the client, and render the shell around the existing `CardGrid`. Use small pure helpers for env parsing and connection-state mapping so the current Vitest setup can cover the new behavior without adding a browser test harness.

**Tech Stack:** React 19, TypeScript, Express, Vite, Tailwind CSS v4, Vitest

---

## File Structure

- Create: `server/shellConfig.ts`
  Responsibility: parse env-backed header/footer config into a safe serializable shape.
- Create: `server/routes/shell.ts`
  Responsibility: serve `GET /api/shell` using the parsed shell config.
- Modify: `server/env.ts`
  Responsibility: expose raw shell env keys.
- Modify: `server/index.ts`
  Responsibility: mount the new shell router.
- Create: `src/app/shell/types.ts`
  Responsibility: share client-side shell config and connection-state types.
- Create: `src/app/shell/api.ts`
  Responsibility: fetch `/api/shell` and `/api/healthz`.
- Create: `src/app/shell/useShellClock.ts`
  Responsibility: provide live time/date display values.
- Create: `src/app/shell/useShellConfig.ts`
  Responsibility: load shell config with safe fallback values.
- Create: `src/app/shell/useConnectionStatus.ts`
  Responsibility: poll `/api/healthz` and map reachability into a display state.
- Create: `src/app/shell/shellUi.ts`
  Responsibility: pure client helpers for ticker duplication and connection labels.
- Create: `src/app/shell/ShellHeader.tsx`
  Responsibility: render username, live time/date, and settings button.
- Create: `src/app/shell/ShellFooter.tsx`
  Responsibility: render looping ticker and connection pill.
- Modify: `src/App.tsx`
  Responsibility: wrap `CardGrid` with the new shell layout.
- Modify: `.env.example`
  Responsibility: document `HEADER_USER_NAME` and `FOOTER_TICKER_ITEMS`.
- Create: `tests/shellConfig.test.ts`
  Responsibility: test env parsing and shell payload shaping.
- Create: `tests/shellUi.test.ts`
  Responsibility: test ticker-item fallback/duplication and connection-state mapping.

### Task 1: Add Server-Side Shell Config Parsing

**Files:**
- Create: `server/shellConfig.ts`
- Modify: `server/env.ts`
- Test: `tests/shellConfig.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildShellConfig } from "../server/shellConfig";

describe("shell config", () => {
  it("parses the user name and ticker items from env values", () => {
    expect(buildShellConfig({
      headerUserName: "Dayle",
      footerTickerItems: "Alpha|| Beta || ||Gamma"
    })).toEqual({
      userName: "Dayle",
      tickerItems: ["Alpha", "Beta", "Gamma"]
    });
  });

  it("falls back safely when env values are blank", () => {
    expect(buildShellConfig({
      headerUserName: "   ",
      footerTickerItems: "   "
    })).toEqual({
      userName: "User",
      tickerItems: []
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/shellConfig.test.ts`
Expected: FAIL with `Cannot find module '../server/shellConfig'` or missing export errors.

- [ ] **Step 3: Write minimal implementation**

`server/shellConfig.ts`

```ts
export type ShellEnvConfig = {
  headerUserName: string;
  footerTickerItems: string;
};

export type ShellConfig = {
  userName: string;
  tickerItems: string[];
};

const DEFAULT_USER_NAME = "User";

export function buildShellConfig(config: ShellEnvConfig): ShellConfig {
  const userName = config.headerUserName.trim() || DEFAULT_USER_NAME;
  const tickerItems = config.footerTickerItems
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);

  return { userName, tickerItems };
}
```

`server/env.ts`

```ts
  headerUserName: process.env.HEADER_USER_NAME ?? "",
  footerTickerItems: process.env.FOOTER_TICKER_ITEMS ?? "",
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/shellConfig.test.ts`
Expected: PASS with 2 passing tests.

### Task 2: Expose Shell Config Through the API

**Files:**
- Create: `server/routes/shell.ts`
- Modify: `server/index.ts`
- Test: `tests/shellConfig.test.ts`

- [ ] **Step 1: Extend the failing test with route-shape coverage**

Append this test to `tests/shellConfig.test.ts`:

```ts
import { getShellConfigResponse } from "../server/routes/shell";

  it("returns the api payload shape from env-backed config", () => {
    expect(getShellConfigResponse({
      headerUserName: "Dayle",
      footerTickerItems: "One||Two"
    })).toEqual({
      userName: "Dayle",
      tickerItems: ["One", "Two"]
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/shellConfig.test.ts`
Expected: FAIL with `Cannot find module '../server/routes/shell'` or missing export errors.

- [ ] **Step 3: Write minimal implementation**

`server/routes/shell.ts`

```ts
import { Router } from "express";
import { env } from "../env.js";
import { buildShellConfig, type ShellEnvConfig } from "../shellConfig.js";

export const shellRouter = Router();

export function getShellConfigResponse(config: ShellEnvConfig) {
  return buildShellConfig(config);
}

shellRouter.get("/", (_req, res) => {
  res.json(getShellConfigResponse({
    headerUserName: env.headerUserName,
    footerTickerItems: env.footerTickerItems
  }));
});
```

`server/index.ts`

```ts
import { shellRouter } from "./routes/shell.js";

app.use("/api/shell", shellRouter);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/shellConfig.test.ts`
Expected: PASS with 3 passing tests.

### Task 3: Add Pure Client Helpers For Footer State

**Files:**
- Create: `src/app/shell/shellUi.ts`
- Create: `src/app/shell/types.ts`
- Test: `tests/shellUi.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildTickerTrack, getConnectionState } from "../src/app/shell/shellUi";

describe("shell ui helpers", () => {
  it("duplicates ticker items for a seamless marquee track", () => {
    expect(buildTickerTrack(["Alpha", "Beta"])).toEqual(["Alpha", "Beta", "Alpha", "Beta"]);
  });

  it("provides a fallback ticker message when there are no items", () => {
    expect(buildTickerTrack([])).toEqual(["No news updates configured", "No news updates configured"]);
  });

  it("maps successful health checks to an online pill", () => {
    expect(getConnectionState(true)).toEqual({ label: "Online", tone: "online" });
  });

  it("maps failed health checks to an offline pill", () => {
    expect(getConnectionState(false)).toEqual({ label: "Offline", tone: "offline" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/shellUi.test.ts`
Expected: FAIL with `Cannot find module '../src/app/shell/shellUi'`.

- [ ] **Step 3: Write minimal implementation**

`src/app/shell/types.ts`

```ts
export type ShellConfig = {
  userName: string;
  tickerItems: string[];
};

export type ConnectionTone = "online" | "offline";

export type ConnectionState = {
  label: string;
  tone: ConnectionTone;
};
```

`src/app/shell/shellUi.ts`

```ts
import type { ConnectionState } from "./types";

const EMPTY_TICKER_MESSAGE = "No news updates configured";

export function buildTickerTrack(items: string[]) {
  const source = items.length ? items : [EMPTY_TICKER_MESSAGE];
  return [...source, ...source];
}

export function getConnectionState(isOnline: boolean): ConnectionState {
  return isOnline
    ? { label: "Online", tone: "online" }
    : { label: "Offline", tone: "offline" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/shellUi.test.ts`
Expected: PASS with 4 passing tests.

### Task 4: Add Client Fetching And Clock Hooks

**Files:**
- Create: `src/app/shell/api.ts`
- Create: `src/app/shell/useShellConfig.ts`
- Create: `src/app/shell/useConnectionStatus.ts`
- Create: `src/app/shell/useShellClock.ts`

- [ ] **Step 1: Write the minimal hook and API implementation**

`src/app/shell/api.ts`

```ts
import type { ShellConfig } from "./types";

export async function getShellConfig(): Promise<ShellConfig> {
  const response = await fetch("/api/shell");
  if (!response.ok) throw new Error(`Shell config failed with ${response.status}`);
  return response.json() as Promise<ShellConfig>;
}

export async function getHealthStatus(): Promise<boolean> {
  const response = await fetch("/api/healthz");
  return response.ok;
}
```

`src/app/shell/useShellConfig.ts`

```ts
import { useEffect, useState } from "react";
import { getShellConfig } from "./api";
import type { ShellConfig } from "./types";

const fallbackConfig: ShellConfig = { userName: "User", tickerItems: [] };

export function useShellConfig() {
  const [config, setConfig] = useState<ShellConfig>(fallbackConfig);

  useEffect(() => {
    let cancelled = false;
    getShellConfig()
      .then((nextConfig) => {
        if (!cancelled) setConfig(nextConfig);
      })
      .catch(() => {
        if (!cancelled) setConfig(fallbackConfig);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
```

`src/app/shell/useConnectionStatus.ts`

```ts
import { useEffect, useState } from "react";
import { getHealthStatus } from "./api";
import { getConnectionState } from "./shellUi";

const POLL_MS = 15000;

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      void getHealthStatus()
        .then((ok) => {
          if (!cancelled) setIsOnline(ok);
        })
        .catch(() => {
          if (!cancelled) setIsOnline(false);
        });
    };

    check();
    const intervalId = window.setInterval(check, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return getConnectionState(isOnline);
}
```

`src/app/shell/useShellClock.ts`

```ts
import { useEffect, useState } from "react";

function readClock(now: Date) {
  return {
    timeText: new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    }).format(now),
    dateText: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(now)
  };
}

export function useShellClock() {
  const [clock, setClock] = useState(() => readClock(new Date()));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(readClock(new Date()));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return clock;
}
```

- [ ] **Step 2: Run type checks for the new hooks**

Run: `npm run typecheck`
Expected: PASS with no TypeScript errors.

### Task 5: Render The Header And Footer Shell

**Files:**
- Create: `src/app/shell/ShellHeader.tsx`
- Create: `src/app/shell/ShellFooter.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the minimal shell components**

`src/app/shell/ShellHeader.tsx`

```tsx
import { Settings2 } from "lucide-react";

type ShellHeaderProps = {
  userName: string;
  timeText: string;
  dateText: string;
};

export function ShellHeader({ userName, timeText, dateText }: ShellHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/55 px-5 py-4 backdrop-blur-xl">
      <div className="min-w-0">
        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">User</p>
        <p className="truncate text-lg font-semibold text-foreground">{userName}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-base font-semibold text-foreground">{timeText}</p>
          <p className="text-xs text-muted-foreground">{dateText}</p>
        </div>
        <button
          type="button"
          aria-label="Open settings"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-foreground transition hover:bg-accent/70"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
```

`src/app/shell/ShellFooter.tsx`

```tsx
import { cn } from "@/lib/utils";
import { buildTickerTrack } from "./shellUi";
import type { ConnectionState } from "./types";

type ShellFooterProps = {
  tickerItems: string[];
  connection: ConnectionState;
};

export function ShellFooter({ tickerItems, connection }: ShellFooterProps) {
  const trackItems = buildTickerTrack(tickerItems);

  return (
    <footer className="flex items-center gap-4 overflow-hidden rounded-3xl border border-border/60 bg-background/55 px-4 py-3 backdrop-blur-xl">
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="shell-ticker-track flex min-w-max items-center gap-8 pr-8">
          {trackItems.map((item, index) => (
            <span className="text-sm text-muted-foreground" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
          connection.tone === "online"
            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
            : "border-rose-400/40 bg-rose-500/10 text-rose-200"
        )}
      >
        {connection.label}
      </div>
    </footer>
  );
}
```

`src/App.tsx`

```tsx
import { ShellFooter } from "@/app/shell/ShellFooter";
import { ShellHeader } from "@/app/shell/ShellHeader";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useShellClock } from "@/app/shell/useShellClock";
import { useShellConfig } from "@/app/shell/useShellConfig";
import { CardGrid } from "@/features/cards/CardGrid";
import { cardRegistry } from "@/features/cards/registry";

function App() {
  const { userName, tickerItems } = useShellConfig();
  const { dateText, timeText } = useShellClock();
  const connection = useConnectionStatus();

  return (
    <main className="dark min-h-svh bg-background px-4 py-4 text-foreground md:px-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-7xl flex-col gap-4">
        <ShellHeader userName={userName} timeText={timeText} dateText={dateText} />
        <div className="flex-1 rounded-[2rem] border border-transparent py-1">
          <CardGrid cards={cardRegistry} />
        </div>
        <ShellFooter tickerItems={tickerItems} connection={connection} />
      </div>
    </main>
  );
}

export default App;
```

- [ ] **Step 2: Add the marquee animation to global styles**

Append this to `src/styles/global.css`:

```css
@keyframes shell-ticker-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

.shell-ticker-track {
  animation: shell-ticker-scroll 28s linear infinite;
}
```

- [ ] **Step 3: Run type checks for the rendered shell**

Run: `npm run typecheck`
Expected: PASS with no TypeScript errors.

### Task 6: Document Env Keys And Run Final Verification

**Files:**
- Modify: `.env.example`
- Verify: `tests/shellConfig.test.ts`
- Verify: `tests/shellUi.test.ts`

- [ ] **Step 1: Document the new env keys**

Add these lines near the existing dashboard defaults in `.env.example`:

```env
HEADER_USER_NAME=Dayle
FOOTER_TICKER_ITEMS=Welcome back to Aura||Local rail delays easing this evening||Three tasks due before 18:00
```

- [ ] **Step 2: Run focused tests**

Run: `npm test -- tests/shellConfig.test.ts tests/shellUi.test.ts`
Expected: PASS with all shell tests green.

- [ ] **Step 3: Run full verification**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm test`
Expected: PASS.
