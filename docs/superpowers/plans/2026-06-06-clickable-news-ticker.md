# Clickable News Ticker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render footer ticker entries as clickable `Source · Title` links that open in a new tab using RSS article data from `.env` feeds.

**Architecture:** Keep RSS fetching and parsing on the server, but change the shell config payload from plain ticker strings to article objects with `source`, `title`, and `url`. Update the client shell types and footer renderer to duplicate and display those article objects as links while preserving the existing marquee behavior and fallback path.

**Tech Stack:** TypeScript, Express, React, Vitest, Tailwind CSS v4

---

### Task 1: Add failing tests for article-shaped ticker data

**Files:**
- Modify: `tests/newsTicker.test.ts`
- Modify: `tests/shellFooter.test.tsx`

- [ ] **Step 1: Write the failing server test**

```ts
await expect(resolveTickerItems({
  footerTickerItems: "Fallback item",
  newsRssFeeds: "BBC|https://example.com/bbc.xml"
}, fetchFeed)).resolves.toEqual([
  { source: "BBC", title: "First headline", url: "https://example.com/first" }
]);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/newsTicker.test.ts`
Expected: FAIL because `resolveTickerItems()` currently returns `string[]` titles only.

- [ ] **Step 3: Write the failing footer render test**

```tsx
renderToStaticMarkup(
  <ShellFooter
    tickerItems={[{ source: "BBC", title: "Headline", url: "https://example.com/story" }]}
    connection={{ label: "Online", tone: "online" }}
  />
);
```

Assert that the markup contains `BBC`, `Headline`, `href="https://example.com/story"`, `target="_blank"`, and `rel="noreferrer"`.

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- tests/shellFooter.test.tsx`
Expected: FAIL because `ShellFooter` currently expects `string[]` and renders plain text spans.

### Task 2: Implement server-side article parsing

**Files:**
- Modify: `server/newsTicker.ts`
- Modify: `tests/newsTicker.test.ts`

- [ ] **Step 1: Add an article type and feed parser**

Update the parser to extract source name from each configured feed entry and both title/link from each RSS item.

- [ ] **Step 2: Return article objects from `resolveTickerItems()`**

Return objects shaped like:

```ts
{ source: "BBC", title: "First headline", url: "https://example.com/first" }
```

Fallback items should still work, using a safe placeholder source such as `Update` and an empty `url`.

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test -- tests/newsTicker.test.ts`
Expected: PASS

### Task 3: Update shell payload and footer rendering

**Files:**
- Modify: `src/app/shell/types.ts`
- Modify: `src/app/shell/shellUi.ts`
- Modify: `src/app/shell/ShellFooter.tsx`
- Modify: `src/app/shell/useShellConfig.ts`
- Modify: `server/shellConfig.ts`
- Modify: `server/routes/shell.ts`
- Modify: `tests/shellUi.test.ts`
- Modify: `tests/shellFooter.test.tsx`
- Modify: `tests/shellConfig.test.ts`

- [ ] **Step 1: Change shell config types to article objects**

Use a shared client/server payload shape:

```ts
type TickerItem = {
  source: string;
  title: string;
  url: string;
};
```

- [ ] **Step 2: Update `buildTickerTrack()` to duplicate article objects**

Keep the fallback behavior, but return article objects instead of strings.

- [ ] **Step 3: Render clickable links in the footer**

Replace the text span with an anchor:

```tsx
<a href={item.url} target="_blank" rel="noreferrer" className="...">
  <span className="...">{item.source}</span>
  <span className="...">{item.title}</span>
</a>
```

If `url` is empty for a fallback item, render a non-clickable span so the UI still works.

- [ ] **Step 4: Run footer and shell tests to verify they pass**

Run: `npm test -- tests/shellFooter.test.tsx tests/shellUi.test.ts tests/shellConfig.test.ts`
Expected: PASS

### Task 4: Final verification

**Files:**
- No code changes required

- [ ] **Step 1: Run targeted regression suite**

Run: `npm test -- tests/newsTicker.test.ts tests/shellFooter.test.tsx tests/shellUi.test.ts tests/shellConfig.test.ts`
Expected: PASS

- [ ] **Step 2: Run full typecheck**

Run: `npm run typecheck`
Expected: PASS
