# Client Source Round Robin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Randomize source order once per page load and build the footer ticker by cycling through sources one after another.

**Architecture:** Keep the server ticker payload unchanged and move sequencing logic into the client shell UI helper. Group articles by source, shuffle the source keys once with a page-load random seed, then emit items round-robin across those source groups before duplicating the final sequence for the marquee track.

**Tech Stack:** TypeScript, React, Vitest

---

### Task 1: Add failing tests for randomized round-robin ordering

**Files:**
- Modify: `tests/shellUi.test.ts`

- [ ] **Step 1: Write the failing test**

Add a deterministic-random test similar to:

```ts
expect(buildTickerTrack([
  { source: "BBC", title: "A1", url: "https://example.com/a1" },
  { source: "BBC", title: "A2", url: "https://example.com/a2" },
  { source: "Globe", title: "B1", url: "https://example.com/b1" },
  { source: "Echo", title: "C1", url: "https://example.com/c1" }
], () => 0)).toEqual([
  { source: "Globe", title: "B1", url: "https://example.com/b1" },
  { source: "Echo", title: "C1", url: "https://example.com/c1" },
  { source: "BBC", title: "A1", url: "https://example.com/a1" },
  { source: "BBC", title: "A2", url: "https://example.com/a2" },
  ...sameAgain
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/shellUi.test.ts`
Expected: FAIL because `buildTickerTrack()` currently preserves incoming order and does not accept a randomizer.

### Task 2: Implement source-grouped round-robin ticker sequencing

**Files:**
- Modify: `src/app/shell/shellUi.ts`
- Modify: `tests/shellUi.test.ts`

- [ ] **Step 1: Add a small source-shuffle helper**

Implement a local shuffle helper that accepts an optional random function and returns shuffled source keys.

- [ ] **Step 2: Build round-robin ticker order from grouped sources**

Update `buildTickerTrack()` to:

1. Group incoming items by `source`
2. Shuffle source keys once
3. Emit one article per source in rounds until all source groups are exhausted
4. Duplicate the resulting sequence for the marquee track

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
