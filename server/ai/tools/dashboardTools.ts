import { randomUUID } from "node:crypto";
import { getStorageDriver, withSyncTracking } from "../../storage/driver.js";
import type { AssistantTool, ToolContext } from "./types.js";

// Write-capable tools that let the assistant manage the user's dashboard data.
// Notes, to-dos, and calendar events go through the user-scoped storage driver
// (Supabase in production, JSON in dev), so these tools read/modify/save the
// same collections the cards render from. The cards pick up changes on their
// next load.

const readItems = <T>(ctx: ToolContext, name: string) =>
  withSyncTracking(() => getStorageDriver().list<T>(ctx.userId, name));
const writeItems = <T>(ctx: ToolContext, name: string, items: T[]) =>
  withSyncTracking(() => getStorageDriver().replaceCollection(ctx.userId, name, items));

type Todo = { id: string; text: string; done: boolean; createdAt: string };
type Note = { id: string; text: string; updatedAt: string; title?: string; color?: string };
type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  category?: string;
};

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// Resolve which stored item an action refers to: prefer an exact id, otherwise a
// case-insensitive match on the item's text/title.
function findMatch<T extends { id: string }>(items: T[], args: Record<string, unknown>, fields: (keyof T)[]): T | undefined {
  const id = str(args.id);
  if (id) {
    const byId = items.find((item) => item.id === id);
    if (byId) return byId;
  }
  const needle = str(args.text || args.title).toLowerCase();
  if (!needle) return undefined;
  return items.find((item) => fields.some((field) => String(item[field] ?? "").toLowerCase().includes(needle)));
}

export const todosTool: AssistantTool = {
  name: "manage_todos",
  description: "List, add, complete, or remove the user's to-do items on their dashboard.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "add", "complete", "remove"], description: "What to do." },
      text: { type: "string", description: "The to-do text. Required for add; used to match for complete/remove." },
      id: { type: "string", description: "The id of an existing to-do (from a prior list). Optional." }
    },
    required: ["action"],
    additionalProperties: false
  },
  execute: async (args, ctx) => {
    const action = str(args.action) || "list";
    const items = await readItems<Todo>(ctx, "todos");

    if (action === "add") {
      const text = str(args.text);
      if (!text) return { error: "No to-do text provided." };
      const todo: Todo = { id: randomUUID(), text, done: false, createdAt: new Date().toISOString() };
      await writeItems(ctx, "todos", [...items, todo]);
      return { ok: true, added: todo.text };
    }

    if (action === "complete" || action === "remove") {
      const target = findMatch(items, args, ["text"]);
      if (!target) return { error: "Couldn't find a matching to-do." };
      const next =
        action === "complete"
          ? items.map((todo) => (todo.id === target.id ? { ...todo, done: true } : todo))
          : items.filter((todo) => todo.id !== target.id);
      await writeItems(ctx, "todos", next);
      return action === "complete" ? { ok: true, completed: target.text } : { ok: true, removed: target.text };
    }

    return { todos: items.map((todo) => ({ id: todo.id, text: todo.text, done: todo.done })) };
  }
};

export const notesTool: AssistantTool = {
  name: "manage_notes",
  description: "List, add, or remove the user's notes on their dashboard.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "add", "remove"], description: "What to do." },
      title: { type: "string", description: "Optional short note title." },
      text: { type: "string", description: "The note body. Required for add; used to match for remove." },
      id: { type: "string", description: "The id of an existing note (from a prior list). Optional." }
    },
    required: ["action"],
    additionalProperties: false
  },
  execute: async (args, ctx) => {
    const action = str(args.action) || "list";
    const items = await readItems<Note>(ctx, "notes");

    if (action === "add") {
      const text = str(args.text);
      const title = str(args.title);
      if (!text && !title) return { error: "No note text provided." };
      const note: Note = { id: randomUUID(), text, title: title || undefined, updatedAt: new Date().toISOString() };
      await writeItems(ctx, "notes", [...items, note]);
      return { ok: true, added: note.title || note.text };
    }

    if (action === "remove") {
      const target = findMatch(items, args, ["title", "text"]);
      if (!target) return { error: "Couldn't find a matching note." };
      await writeItems(ctx, "notes", items.filter((note) => note.id !== target.id));
      return { ok: true, removed: target.title || target.text };
    }

    return { notes: items.map((note) => ({ id: note.id, title: note.title, text: note.text })) };
  }
};

type Reminder = { id: string; text: string; due?: string; done: boolean };

export const remindersTool: AssistantTool = {
  name: "manage_reminders",
  description: "List, add, complete, or remove the user's reminders on their dashboard.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "add", "complete", "remove"], description: "What to do." },
      text: { type: "string", description: "The reminder text. Required for add; used to match for complete/remove." },
      due: { type: "string", description: "Optional ISO 8601 due datetime, e.g. 2026-06-09T14:00:00." },
      id: { type: "string", description: "The id of an existing reminder (from a prior list). Optional." }
    },
    required: ["action"],
    additionalProperties: false
  },
  execute: async (args, ctx) => {
    const action = str(args.action) || "list";
    const items = await readItems<Reminder>(ctx, "reminders");

    if (action === "add") {
      const text = str(args.text);
      if (!text) return { error: "No reminder text provided." };
      const dueRaw = str(args.due);
      const due = dueRaw && !Number.isNaN(new Date(dueRaw).getTime()) ? new Date(dueRaw).toISOString() : undefined;
      const reminder: Reminder = { id: randomUUID(), text, due, done: false };
      await writeItems(ctx, "reminders", [...items, reminder]);
      return { ok: true, added: reminder.text, due: reminder.due };
    }

    if (action === "complete" || action === "remove") {
      const target = findMatch(items, args, ["text"]);
      if (!target) return { error: "Couldn't find a matching reminder." };
      const next =
        action === "complete"
          ? items.map((r) => (r.id === target.id ? { ...r, done: true } : r))
          : items.filter((r) => r.id !== target.id);
      await writeItems(ctx, "reminders", next);
      return action === "complete" ? { ok: true, completed: target.text } : { ok: true, removed: target.text };
    }

    return { reminders: items.map((r) => ({ id: r.id, text: r.text, due: r.due, done: r.done })) };
  }
};

export const calendarTool: AssistantTool = {
  name: "manage_calendar",
  description:
    "List, add, or remove events on the user's calendar (the upcoming/calendar cards). Use ISO 8601 datetimes for start and end.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "add", "remove"], description: "What to do." },
      title: { type: "string", description: "Event title. Required for add; used to match for remove." },
      start: { type: "string", description: "ISO 8601 start datetime, e.g. 2026-06-09T14:00:00. Required for add." },
      end: { type: "string", description: "Optional ISO 8601 end datetime." },
      location: { type: "string", description: "Optional event location." },
      description: { type: "string", description: "Optional event details." },
      id: { type: "string", description: "The id of an existing event (from a prior list). Optional." }
    },
    required: ["action"],
    additionalProperties: false
  },
  execute: async (args, ctx) => {
    const action = str(args.action) || "list";
    const items = await readItems<CalendarEvent>(ctx, "events");

    if (action === "add") {
      const title = str(args.title);
      const start = str(args.start);
      if (!title) return { error: "No event title provided." };
      if (!start || Number.isNaN(new Date(start).getTime())) {
        return { error: "A valid ISO 8601 start datetime is required, e.g. 2026-06-09T14:00:00." };
      }
      const event: CalendarEvent = {
        id: randomUUID(),
        title,
        start,
        end: str(args.end) || undefined,
        location: str(args.location) || undefined,
        description: str(args.description) || undefined
      };
      await writeItems(ctx, "events", [...items, event]);
      return { ok: true, added: { title: event.title, start: event.start } };
    }

    if (action === "remove") {
      const target = findMatch(items, args, ["title"]);
      if (!target) return { error: "Couldn't find a matching event." };
      await writeItems(ctx, "events", items.filter((event) => event.id !== target.id));
      return { ok: true, removed: target.title };
    }

    return {
      events: items.map((event) => ({ id: event.id, title: event.title, start: event.start, location: event.location }))
    };
  }
};
