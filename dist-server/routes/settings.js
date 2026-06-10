import { Router } from "express";
import { logger } from "../logger.js";
import { getSecretsStatus, secretFields, updateSecrets } from "../secrets.js";
import { configFields, detectLocalModels, getServerConfig, updateServerConfig } from "../serverConfig.js";
export const settingsRouter = Router();
settingsRouter.get("/config", (_req, res) => {
    res.json({ config: getServerConfig() });
});
settingsRouter.patch("/config", async (req, res) => {
    try {
        const body = (req.body ?? {});
        const patch = {};
        for (const field of configFields) {
            if (typeof body[field] === "string")
                patch[field] = body[field];
        }
        await updateServerConfig(patch);
        res.json({ config: getServerConfig() });
    }
    catch (error) {
        logger.error("Failed to update server config", error, { route: "/api/settings/config" });
        res.status(500).json({ message: "Failed to save settings" });
    }
});
// Probe a local AI server (LM Studio / Ollama) for the model(s) it has loaded.
settingsRouter.post("/local/detect", async (req, res) => {
    try {
        const body = (req.body ?? {});
        const provider = body.provider === "ollama" ? "ollama" : "lmstudio";
        const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl : "";
        const models = await detectLocalModels(provider, baseUrl);
        res.json({ models });
    }
    catch (error) {
        logger.error("Failed to detect local models", error, { route: "/api/settings/local/detect" });
        res.status(500).json({ message: "Failed to detect local models" });
    }
});
// Never returns the actual secret values — only whether each is set and a masked
// preview, so the UI can show them like password fields.
settingsRouter.get("/secrets", (_req, res) => {
    res.json({ secrets: getSecretsStatus() });
});
settingsRouter.patch("/secrets", async (req, res) => {
    try {
        const body = (req.body ?? {});
        const patch = {};
        for (const field of secretFields) {
            if (typeof body[field] === "string")
                patch[field] = body[field];
        }
        await updateSecrets(patch);
        res.json({ secrets: getSecretsStatus() });
    }
    catch (error) {
        logger.error("Failed to update secrets", error, { route: "/api/settings/secrets" });
        res.status(500).json({ message: "Failed to save settings" });
    }
});
