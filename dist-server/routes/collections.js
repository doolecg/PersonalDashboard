import { Router } from "express";
import { logger } from "../logger.js";
import { readCollection, writeCollection } from "../store/collectionStore.js";
// A small REST contract shared by notes / todos / reminders: GET returns the
// whole list, PUT replaces it. Cards own the list shape and send it back wholesale.
export function createCollectionRouter(name) {
    const router = Router();
    router.get("/", async (_req, res, next) => {
        try {
            res.json({ items: await readCollection(name) });
        }
        catch (error) {
            next(error);
        }
    });
    router.put("/", async (req, res, next) => {
        try {
            const items = Array.isArray(req.body?.items) ? req.body.items : [];
            await writeCollection(name, items);
            res.json({ items });
        }
        catch (error) {
            logger.error(`Failed to save collection ${name}`, error, { route: `/api/${name}` });
            next(error);
        }
    });
    return router;
}
