import { Router } from "express";
import { env } from "../env.js";
import { getCalendarToday } from "../providers/calendarProvider.js";
import { getFinanceSummary } from "../providers/financeProvider.js";
import { getHealth } from "../providers/healthProvider.js";
import { listNotes, listReminders } from "../providers/localCrudProvider.js";
import { getMessages } from "../providers/messagesProvider.js";
import { getNews } from "../providers/newsProvider.js";
import { providerResult } from "../providers/providerResult.js";
import { getWeather } from "../providers/weatherProvider.js";
export const dashboardRouter = Router();
export async function getDashboardPayload() {
    const [weather, messages, reminders, calendar, finance, health, news, notes] = await Promise.all([
        getWeather(),
        getMessages(),
        listReminders(),
        getCalendarToday(),
        getFinanceSummary(),
        getHealth(),
        getNews(),
        listNotes()
    ]);
    const briefing = {
        generatedAt: new Date().toISOString(),
        bullets: []
    };
    return {
        name: env.dashboardName,
        briefing: providerResult("ok", briefing),
        weather,
        messages,
        reminders,
        calendar,
        finance,
        health,
        news,
        notes
    };
}
dashboardRouter.get("/", async (_req, res) => {
    res.json(await getDashboardPayload());
});
