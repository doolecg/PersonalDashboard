import { Router } from "express";
import { logger } from "../logger.js";
import { listGoogleEvents } from "../google/calendar.js";
import { buildAuthUrl, clearTokens, exchangeCode, isConnected, isGoogleConfigured } from "../google/oauth.js";
export const googleRouter = Router();
googleRouter.get("/auth", (_req, res) => {
    if (!isGoogleConfigured()) {
        return res.status(400).send("Google is not configured. Add your client ID and secret in Settings first.");
    }
    res.redirect(buildAuthUrl("aura"));
});
googleRouter.get("/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code)
        return res.status(400).send("Missing authorization code.");
    try {
        await exchangeCode(code);
        res.send("<!doctype html><meta charset='utf-8'><title>Connected</title>" +
            "<body style='font-family:system-ui;background:#0a0e1f;color:#fff;display:grid;place-items:center;height:100vh'>" +
            "<div style='text-align:center'><h2>Google Calendar connected</h2><p>You can close this window.</p>" +
            "<script>setTimeout(function(){try{window.close()}catch(e){};window.location.href='/'},1200)</script></div></body>");
    }
    catch (error) {
        logger.error("Google callback failed", error, { route: "/api/google/callback" });
        res.status(500).send("Google sign-in failed. Please try again.");
    }
});
googleRouter.get("/status", async (_req, res) => {
    res.json({ configured: isGoogleConfigured(), connected: await isConnected() });
});
googleRouter.post("/disconnect", async (_req, res) => {
    await clearTokens();
    res.json({ connected: false });
});
googleRouter.get("/events", async (_req, res) => {
    try {
        res.json({ events: await listGoogleEvents() });
    }
    catch (error) {
        logger.error("Google events failed", error, { route: "/api/google/events" });
        res.status(502).json({ message: "Failed to load Google events" });
    }
});
