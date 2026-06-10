import { Router } from "express";
import { getAuth } from "../auth/middleware.js";
import { getStorageDriver, getSyncStatus, withSyncTracking } from "../storage/driver.js";

export const syncRouter = Router();

syncRouter.get("/status", (_req, res) => {
  res.json(getSyncStatus());
});

// "Sync now": data is written through to storage on every change, so this is a
// connectivity check — a real round-trip read that refreshes last-sync state.
syncRouter.post("/now", async (req, res) => {
  const { userId } = getAuth(req);
  try {
    await withSyncTracking(() => getStorageDriver().list(userId, "todos"));
    res.json({ ok: true, ...getSyncStatus() });
  } catch {
    res.status(503).json({ ok: false, ...getSyncStatus() });
  }
});
