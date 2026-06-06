import { Router } from "express";
import { getFinanceSummary } from "../providers/financeProvider.js";
export const financeRouter = Router();
financeRouter.get("/summary", async (_req, res) => {
    res.json(await getFinanceSummary());
});
