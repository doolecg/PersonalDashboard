import { Router } from "express";
import { getHealth } from "../providers/healthProvider.js";
export const healthRouter = Router();
healthRouter.get("/", async (_req, res) => {
    res.json(await getHealth());
});
