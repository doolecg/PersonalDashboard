# Ticker 15-Minute Reseed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-randomize the footer ticker source order only every 15 minutes while the page remains open.

**Architecture:** Keep the ticker sequencing logic pure in `shellUi.ts` and move refresh cadence control into `ShellFooter.tsx`. Use a 15-minute time bucket plus a timer aligned to the next 15-minute boundary so the footer recomputes a new seeded track only when that bucket changes.

**Tech Stack:** TypeScript, React, Vitest

---

### Task 1: Add failing tests for 15-minute ticker cadence helpers

**Files:**
- Modify: `tests/shellUi.test.ts`
- Modify: `src/app/shell/shellUi.ts`

- [ ] **Step 1: Write the failing test**

Add tests for helper functions such as:

```ts
expect(getTickerSeedBucket(0)).toBe(0);
expect(getTickerSeedBucket(899999)).toBe(0);
expect(getTickerSeedBucket(900000)).toBe(1);

expect(getMillisecondsUntilNextTickerBucket(0)).toBe(900000);
expect(getMillisecondsUntilNextTickerBucket(899000)).toBe(1000);
expect(getMillisecondsUntilNextTickerBucket(900000)).toBe(900000);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/shellUi.test.ts`
Expected: FAIL because the helper functions do not exist yet.

### Task 2: Implement 15-minute bucket helpers and footer cadence

**Files:**
- Modify: `src/app/shell/shellUi.ts`
- Modify: `src/app/shell/ShellFooter.tsx`
- Modify: `tests/shellUi.test.ts`

- [ ] **Step 1: Add 15-minute bucket helpers**

Add small exported helpers for bucket calculation and milliseconds until the next bucket.

- [ ] **Step 2: Update `ShellFooter` to reseed only when the bucket changes**

Use state/effect so the footer:

1. Reads the current bucket on mount
2. Schedules a timer to the next 15-minute boundary
3. Updates the bucket and reschedules after each boundary
4. Passes a deterministic randomizer derived from the current bucket into `buildTickerTrack()`

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test -- tests/shellUi.test.ts`
Expected: PASS

### Task 3: Final verification

**Files:**
- No code changes required

- [ ] **Step 1: Run targeted regression suite**

Run: `npm test -- tests/shellUi.test.ts tests/shellFooter.test.tsx tests/newsTicker.test.ts tests/shellConfig.test.ts`
Expected: PASS

- [ ] **Step 2: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS
