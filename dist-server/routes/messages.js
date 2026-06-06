import { Router } from "express";
import { getMessages } from "../providers/messagesProvider.js";
export const messagesRouter = Router();
messagesRouter.get("/", async (_req, res) => {
    res.json(await getMessages());
});
