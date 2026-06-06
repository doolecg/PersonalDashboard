import { Router } from "express";
import { getNews } from "../providers/newsProvider.js";
export const newsRouter = Router();
newsRouter.get("/", async (_req, res) => {
    res.json(await getNews());
});
