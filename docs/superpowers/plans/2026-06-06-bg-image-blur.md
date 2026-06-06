# Blurred Background Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render `src/assets/bg.png` as the primary dashboard background with a strong blur while keeping all shell content sharp and readable.

**Architecture:** Add a dedicated background layer inside `src/App.tsx` so the image blur is isolated from the header, cards, and footer. Keep the content in a separate relative foreground layer above the image and add a dark overlay directly on the background layer for contrast.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Vitest

---

## File Structure

- Modify: `src/App.tsx`
  Responsibility: import `bg.png`, add the blurred absolute background layer, and keep shell content in the foreground layer.
- Create: `src/app/shell/background.ts`
  Responsibility: expose the exact background layer class names as a pure helper for narrow testing.
- Create: `tests/backgroundLayer.test.ts`
  Responsibility: verify the background helper includes the image blur, overlay, and layering intent.

### Task 1: Lock The Background Layer Contract With A Test

**Files:**
- Create: `tests/backgroundLayer.test.ts`
- Test: `tests/backgroundLayer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { shellBackgroundClassName, shellBackgroundImageClassName, shellForegroundClassName } from "../src/app/shell/background";

describe("shell background layer", () => {
  it("keeps a separate absolute background layer and a relative foreground layer", () => {
    expect(shellBackgroundClassName).toContain("absolute");
    expect(shellBackgroundClassName).toContain("inset-0");
    expect(shellForegroundClassName).toContain("relative");
    expect(shellForegroundClassName).toContain("z-10");
  });

  it("uses a strong blur treatment on the background image", () => {
    expect(shellBackgroundImageClassName).toContain("bg-cover");
    expect(shellBackgroundImageClassName).toContain("bg-center");
    expect(shellBackgroundImageClassName).toContain("blur-");
  });

  it("includes a dark overlay to preserve dashboard contrast", () => {
    expect(shellBackgroundClassName).toContain("before:bg-black/");
    expect(shellBackgroundClassName).toContain("before:absolute");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/backgroundLayer.test.ts`
Expected: FAIL with `Cannot find module '../src/app/shell/background'`.

- [ ] **Step 3: Write minimal implementation**

`src/app/shell/background.ts`

```ts
export const shellBackgroundClassName = [
  "pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]",
  "before:absolute before:inset-0 before:bg-black/55 before:content-['']"
].join(" ");

export const shellBackgroundImageClassName = [
  "absolute inset-[-4%] bg-cover bg-center bg-no-repeat blur-3xl scale-110"
].join(" ");

export const shellForegroundClassName = "relative z-10 flex min-h-[calc(100svh-2rem)] flex-col gap-4";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/backgroundLayer.test.ts`
Expected: PASS with 3 passing tests.

### Task 2: Render The Blurred Background Image In App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/app/shell/background.ts`

- [ ] **Step 1: Update `src/App.tsx` to render the background image layer**

```tsx
import bgImage from "@/assets/bg.png";
import { shellBackgroundClassName, shellBackgroundImageClassName, shellForegroundClassName } from "@/app/shell/background";
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
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem]">
          <div className={shellBackgroundClassName}>
            <div className={shellBackgroundImageClassName} style={{ backgroundImage: `url(${bgImage})` }} />
          </div>
          <div className={shellForegroundClassName}>
            <ShellHeader userName={userName} timeText={timeText} dateText={dateText} />
            <div className="flex flex-1 justify-center py-1">
              <CardGrid cards={cardRegistry} />
            </div>
            <ShellFooter tickerItems={tickerItems} connection={connection} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
```

- [ ] **Step 2: Verify the app still type-checks**

Run: `npm run typecheck`
Expected: PASS with no TypeScript errors.

### Task 3: Run Focused And Full Verification

**Files:**
- Verify: `tests/backgroundLayer.test.ts`
- Verify: `tests/shellUi.test.ts`

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/backgroundLayer.test.ts tests/shellUi.test.ts`
Expected: PASS with all focused tests green.

- [ ] **Step 2: Run full verification**

Run: `npm run typecheck`
Expected: PASS.

Run: `npm test`
Expected: PASS.
