# RSS Source Randomization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Randomize RSS source order on each `/api/shell` request before building footer ticker items.

**Architecture:** Keep all randomization in `server/newsTicker.ts`, where feed entries are already parsed and fetched. Shuffle the parsed feed-entry list per request, then fetch and flatten articles in that shuffled order so the existing shell payload and footer rendering remain unchanged.

**Tech Stack:** TypeScript, Express, Vitest

---

### Task 1: Add a failing test for shuffled RSS source order

**Files:**
- Modify: `tests/newsTicker.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that injects a deterministic random function and expects feed order to change:

```ts
const fetchFeed = vi
  .fn()
  .mockResolvedValueOnce(new Response(`<?xml version="1.0"?><rss><channel><item><title>First headline</title><link>https://example.com/first</link></item></channel></rss>`))
  .mockResolvedValueOnce(new Response(`<?xml version="1.0"?><rss><channel><item><title>Second headline</title><link>https://example.com/second</link></item></channel></rss>`));

await expect(resolveTickerItems({
  footerTickerItems: "Fallback item",
  newsRssFeeds: "BBC|https://example.com/bbc.xml,Globe|https://example.com/globe.xml"
}, fetchFeed, () => 0.99)).resolves.toEqual([
  { source: "Globe", title: "Second headline", url: "https://example.com/second" },
  { source: "BBC", title: "First headline", url: "https://example.com/first" }
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/newsTicker.test.ts`
Expected: FAIL because `resolveTickerItems()` does not yet accept an injected randomizer or shuffle source order.

### Task 2: Implement per-request source shuffling

**Files:**
- Modify: `server/newsTicker.ts`
- Modify: `tests/newsTicker.test.ts`

- [ ] **Step 1: Add a small shuffle helper**

Implement a local Fisher-Yates-style shuffle helper that accepts a `random` function parameter.

- [ ] **Step 2: Update `resolveTickerItems()` to shuffle parsed feed entries**

Update the function signature to accept an optional random function with `Math.random` default, then shuffle `feedEntries` before `Promise.all(...)`.

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test -- tests/newsTicker.test.ts`
Expected: PASS

### Task 3: Final verification

**Files:**
- No code changes required

- [ ] **Step 1: Run targeted regression suite**

Run: `npm test -- tests/newsTicker.test.ts tests/shellFooter.test.tsx tests/shellConfig.test.ts tests/shellUi.test.ts`
Expected: PASS

- [ ] **Step 2: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS
