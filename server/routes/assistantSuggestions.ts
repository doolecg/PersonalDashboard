import { randomUUID } from "node:crypto";
import { Router } from "express";
import { getAuth } from "../auth/middleware.js";
import {
  dismissSuggestion,
  generateSuggestions,
  markAccepted,
  type AssistantActionKind
} from "../assistant/suggestions.js";
import { logger } from "../logger.js";
import { getStorageDriver, withSyncTracking } from "../storage/driver.js";

// Proactive assistant endpoints. All are mounted behind requireAuth; the
// engine itself is deterministic (no AI needed), and write actions only run
// when the user explicitly approves them from the UI or terminal.
export const assistantSuggestionsRouter = Router();

// Per-user in-memory cache so dashboards/terminals don't regenerate on every
// poll (cheap to rebuild, but the Pi appreciates it).
const cache = new Map<string, { at: number; suggestions: Awaited<ReturnType<typeof generateSuggestions>> }>();
const CACHE_TTL_MS = 2 * 60 * 1000;

async function suggestionsFor(userId: string, force = false) {
  const cached = cache.get(userId);
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.suggestions;
  const suggestions = await generateSuggestions(userId);
  cache.set(userId, { at: Date.now(), suggestions });
  return suggestions;
}

assistantSuggestionsRouter.get("/suggestions", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    res.json({ suggestions: await suggestionsFor(userId) });
  } catch (error) {
    next(error);
  }
});

assistantSuggestionsRouter.post("/suggestions/refresh", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    res.json({ suggestions: await suggestionsFor(userId, true) });
  } catch (error) {
    next(error);
  }
});

assistantSuggestionsRouter.post("/suggestions/:id/dismiss", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    await dismissSuggestion(userId, String(req.params.id));
    cache.delete(userId);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

type ExecuteBody = {
  suggestionId?: string;
  action?: AssistantActionKind;
  payload?: Record<string, unknown>;
};

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// Executes a user-approved suggestion action. Only safe, additive operations
// are supported — nothing here deletes data, sends messages, or changes settings.
assistantSuggestionsRouter.post("/actions/execute", async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const body = (req.body ?? {}) as ExecuteBody;
    const action = body.action;
    const payload = body.payload ?? {};
    const driver = getStorageDriver();

    if (action === "create_todo") {
      const text = str(payload.text);
      if (!text) return res.status(400).json({ message: "Todo text is required." });
      const items = await withSyncTracking(() => driver.list<Record<string, unknown>>(userId, "todos"));
      await withSyncTracking(() =>
        driver.replaceCollection(userId, "todos", [
          ...items,
          { id: randomUUID(), text, done: false, createdAt: new Date().toISOString() }
        ])
      );
    } else if (action === "create_reminder") {
      const text = str(payload.text);
      if (!text) return res.status(400).json({ message: "Reminder text is required." });
      const dueRaw = str(payload.due);
      const due = dueRaw && !Number.isNaN(new Date(dueRaw).getTime()) ? new Date(dueRaw).toISOString() : undefined;
      const items = await withSyncTracking(() => driver.list<Record<string, unknown>>(userId, "reminders"));
      await withSyncTracking(() =>
        driver.replaceCollection(userId, "reminders", [...items, { id: randomUUID(), text, due, done: false }])
      );
    } else if (action === "create_note") {
      const text = str(payload.text);
      if (!text) return res.status(400).json({ message: "Note text is required." });
      const items = await withSyncTracking(() => driver.list<Record<string, unknown>>(userId, "notes"));
      await withSyncTracking(() =>
        driver.replaceCollection(userId, "notes", [
          ...items,
          { id: randomUUID(), text, title: str(payload.title) || undefined, updatedAt: new Date().toISOString() }
        ])
      );
    } else if (action !== "open_calendar" && action !== "dismiss") {
      return res.status(400).json({ message: "Unsupported action." });
    }

    if (body.suggestionId) {
      if (action === "dismiss") await dismissSuggestion(userId, body.suggestionId);
      else await markAccepted(userId, body.suggestionId);
      cache.delete(userId);
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error("Assistant action failed", error, { route: "/api/assistant/actions/execute" });
    next(error);
  }
});
