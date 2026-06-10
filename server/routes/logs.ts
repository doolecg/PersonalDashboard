import { Router } from "express";
import { logger, getRecentLogs } from "../logger.js";
import { requireAuth } from "../auth/middleware.js";

export const logsRouter = Router();

// The router is mounted publicly (client-error reporting must work from the
// login screen), so the log *viewer* enforces auth itself.
logsRouter.get("/recent", requireAuth, (_req, res) => {
  res.json({ logs: getRecentLogs() });
});

const truncate = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

logsRouter.post("/client-error", (req, res) => {
  const body = req.body as Record<string, unknown>;

  const message = truncate(body.message, 2048) || "Browser error";
  const kind = truncate(body.kind, 256) || "unknown";
  const stack = truncate(body.stack, 4096) || undefined;
  const path = truncate(body.path, 256) || undefined;
  const userAgent = truncate(body.userAgent, 256) || undefined;

  logger.error("Client error", message, { kind, stack, path, userAgent });
  res.sendStatus(204);
});
