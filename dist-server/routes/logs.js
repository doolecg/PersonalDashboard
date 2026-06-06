import { Router } from "express";
import { logger } from "../logger.js";
export const logsRouter = Router();
logsRouter.post("/client-error", (req, res) => {
    const body = req.body;
    logger.error("Client error", body.message ?? "Browser error", {
        kind: body.kind ?? "unknown",
        stack: body.stack,
        path: body.path,
        userAgent: body.userAgent
    });
    res.sendStatus(204);
});
