import { Router, type Request } from "express";
import { logger } from "../logger.js";
import { geocodePlace } from "../weather/geocode.js";
import { buildFallbackReport, buildWeatherInsight, generateWeatherReport, type WeatherReport } from "../weather/report.js";
import { getWeatherWidgetPayload, type WeatherLocation } from "../weather/service.js";

export const weatherRouter = Router();

function locationFromQuery(req: Request): Partial<WeatherLocation> | undefined {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  return { latitude: lat, longitude: lon, city };
}

weatherRouter.get("/", async (req, res, next) => {
  try {
    res.json(await getWeatherWidgetPayload(locationFromQuery(req)));
  } catch (error) {
    next(error);
  }
});

weatherRouter.get("/geocode", async (req, res, next) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    res.json({ results: await geocodePlace(query) });
  } catch (error) {
    next(error);
  }
});

// The AI report is slow and costs tokens, so cache it per forecast refresh.
let reportCache: { key: string; report: WeatherReport } | null = null;

weatherRouter.get("/report", async (req, res, next) => {
  try {
    const payload = await getWeatherWidgetPayload(locationFromQuery(req));
    const key = `${payload.current.location}:${payload.meta.updatedAt}`;

    if (reportCache?.key === key) {
      return res.json(reportCache.report);
    }

    const insight = buildWeatherInsight(payload);
    let report: WeatherReport;
    try {
      report = { report: await generateWeatherReport(payload), insight, source: "openai" };
    } catch (error) {
      logger.warn("AI weather report unavailable, using generated fallback", {
        message: error instanceof Error ? error.message : String(error),
      });
      report = { report: buildFallbackReport(payload), insight, source: "generated" };
    }

    reportCache = { key, report };
    res.json(report);
  } catch (error) {
    next(error);
  }
});
