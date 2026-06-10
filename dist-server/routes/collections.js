import { Router } from "express";
import { logger } from "../logger.js";
import { getAuth } from "../auth/middleware.js";
import { getStorageDriver, withSyncTracking } from "../storage/driver.js";
// A small REST contract shared by notes / todos / reminders / events: GET returns
// the whole list, PUT replaces it. Cards own the list shape and send it back
// wholesale. Data is scoped to the authenticated user via the storage driver,
// so the same account sees the same list on every device.
export function createCollectionRouter(name) {
    const router = Router();
    router.get("/", async (req, res, next) => {
        try {
            const { userId } = getAuth(req);
            const items = await withSyncTracking(() => getStorageDriver().list(userId, name));
            res.json({ items });
        }
        catch (error) {
            next(error);
        }
    });
    router.put("/", async (req, res, next) => {
        try {
            const { userId } = getAuth(req);
            const items = Array.isArray(req.body?.items) ? req.body.items : [];
            await withSyncTracking(() => getStorageDriver().replaceCollection(userId, name, items));
            res.json({ items });
        }
        catch (error) {
            logger.error(`Failed to save collection ${name}`, error, { route: `/api/${name}` });
            next(error);
        }
    });
    return router;
}
