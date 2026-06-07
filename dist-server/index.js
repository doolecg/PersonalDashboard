import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { aiRouter } from "./routes/ai.js";
import { logsRouter } from "./routes/logs.js";
import { shellRouter } from "./routes/shell.js";
import { weatherRouter } from "./routes/weather.js";
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
app.get("/api/healthz", (_req, res) => {
    res.json({ ok: true, service: "aura", time: new Date().toISOString() });
});
app.use("/api/shell", shellRouter);
app.use("/api/ai", aiRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/log", logsRouter);
if (env.nodeEnv === "production") {
    const distPath = path.resolve(root, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}
else {
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
        }
        catch (error) {
            vite.ssrFixStacktrace(error);
            next(error);
        }
    });
}
app.use((error, req, res, next) => {
    logger.error("Unhandled request error", error, { method: req.method, path: req.originalUrl });
    if (res.headersSent)
        return next(error);
    res.status(500).json({ message: "Internal server error" });
});
const server = app.listen(env.port, () => {
    logger.info(`Aura listening on http://localhost:${env.port}`);
});
server.on("error", (error) => {
    logger.error("Server error", error);
});
