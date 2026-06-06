import { Router } from "express";
import { getCalendarToday } from "../providers/calendarProvider.js";
export const calendarRouter = Router();
calendarRouter.get("/today", async (_req, res) => {
    res.json(await getCalendarToday());
});
