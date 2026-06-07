import { Router } from "express";
import { getWeatherWidgetPayload } from "../weather/service.js";
export const weatherRouter = Router();
weatherRouter.get("/", async (_req, res, next) => {
    try {
        res.json(await getWeatherWidgetPayload());
    }
    catch (error) {
        next(error);
    }
});
