import { Router } from "express";
import { logger } from "../logger.js";
import { getSecretsStatus, secretFields, updateSecrets, type SecretField } from "../secrets.js";
import { configFields, getServerConfig, updateServerConfig, type ConfigField } from "../serverConfig.js";

export const settingsRouter = Router();

settingsRouter.get("/config", (_req, res) => {
  res.json({ config: getServerConfig() });
});

settingsRouter.patch("/config", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch: Partial<Record<ConfigField, string>> = {};
    for (const field of configFields) {
      if (typeof body[field] === "string") patch[field] = body[field] as string;
    }
    await updateServerConfig(patch);
    res.json({ config: getServerConfig() });
  } catch (error) {
    logger.error("Failed to update server config", error, { route: "/api/settings/config" });
    res.status(500).json({ message: "Failed to save settings" });
  }
});

// Never returns the actual secret values — only whether each is set and a masked
// preview, so the UI can show them like password fields.
settingsRouter.get("/secrets", (_req, res) => {
  res.json({ secrets: getSecretsStatus() });
});

settingsRouter.patch("/secrets", async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch: Partial<Record<SecretField, string>> = {};
    for (const field of secretFields) {
      if (typeof body[field] === "string") patch[field] = body[field] as string;
    }
    await updateSecrets(patch);
    res.json({ secrets: getSecretsStatus() });
  } catch (error) {
    logger.error("Failed to update secrets", error, { route: "/api/settings/secrets" });
    res.status(500).json({ message: "Failed to save settings" });
  }
});
