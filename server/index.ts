import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { isAuthRequired, requireAuth } from "./auth/middleware.js";
import { isSupabaseAuthConfigured } from "./supabase.js";
import { aiRouter } from "./routes/ai.js";
import { assistantSuggestionsRouter } from "./routes/assistantSuggestions.js";
import { authRouter } from "./routes/auth.js";
import { syncRouter } from "./routes/sync.js";
import { createCollectionRouter } from "./routes/collections.js";
import { googleOAuthRouter, googleRouter } from "./routes/google.js";
import { logsRouter } from "./routes/logs.js";
import { settingsRouter } from "./routes/settings.js";
import { shellRouter } from "./routes/shell.js";
import { systemRouter } from "./routes/system.js";
import { weatherRouter } from "./routes/weather.js";
import { applyStoredAiSelection } from "./providers/aiRuntime.js";
import { applyStoredSecrets } from "./secrets.js";
import { applyServerConfig } from "./serverConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = env.nodeEnv === "production" ? path.resolve(__dirname, "..") : process.cwd();
const app = express();

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason);
});

app.use(express.json({ limit: "1mb" }));

// Layer any user-set secret/config overrides (from Settings) over the .env
// defaults, and restore the saved AI provider/model selection.
await applyStoredSecrets();
await applyServerConfig();
await applyStoredAiSelection();

// Fail fast on misconfiguration: auth is mandatory in production (Cloudflare
// Tunnel exposure), so missing Supabase auth config is a setup error, not a
// reason to fall back to an open dashboard.
if (isAuthRequired() && !isSupabaseAuthConfigured()) {
  logger.error(
    "Auth is required but Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (and SUPABASE_SERVICE_ROLE_KEY for storage), or set AUTH_ENABLED=false for local development only."
  );
  if (env.nodeEnv === "production") process.exit(1);
}

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, service: "aura", time: new Date().toISOString() });
});

// Public auth metadata (no secrets); everything else under /api requires auth.
app.use("/api/auth", authRouter);
// Client error reporting stays public so login-screen failures are visible,
// but it only accepts size-capped strings and never returns data (the log
// viewer route enforces auth itself).
app.use("/api/log", logsRouter);
// Google OAuth consent redirects are browser navigations without a Bearer token.
app.use("/api/google", googleOAuthRouter);

app.use("/api", requireAuth);

app.use("/api/shell", shellRouter);
app.use("/api/ai", aiRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/system", systemRouter);
app.use("/api/notes", createCollectionRouter("notes"));
app.use("/api/todos", createCollectionRouter("todos"));
app.use("/api/reminders", createCollectionRouter("reminders"));
app.use("/api/events", createCollectionRouter("events"));
app.use("/api/assistant", assistantSuggestionsRouter);
app.use("/api/sync", syncRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/google", googleRouter);

// Catch unmatched /api/* routes before the SPA fallback to avoid serving index.html for them.
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

if (env.nodeEnv === "production") {
  const distPath = path.resolve(root, "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
} else {
  const vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const htmlPath = path.resolve(root, "index.html");
      const template = fs.readFileSync(htmlPath, "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.originalUrl, template));
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled request error", error, { method: req.method, path: req.originalUrl });
  if (res.headersSent) return next(error);
  res.status(500).json({ message: "Internal server error" });
});

const server = app.listen(env.port, () => {
  logger.info(`Aura listening on http://localhost:${env.port}`);
});

server.on("error", (error) => {
  logger.error("Server error", error);
});
