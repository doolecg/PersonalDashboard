import { Router } from "express";
import { getWeather } from "../providers/weatherProvider.js";
export const weatherRouter = Router();
weatherRouter.get("/", async (req, res) => {
    const lat = typeof req.query.lat === "string" ? Number(req.query.lat) : undefined;
    const lon = typeof req.query.lon === "string" ? Number(req.query.lon) : undefined;
    res.json(await getWeather(Number.isFinite(lat) ? lat : undefined, Number.isFinite(lon) ? lon : undefined));
});
