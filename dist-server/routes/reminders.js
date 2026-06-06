import { Router } from "express";
import { createReminder, deleteReminder, listReminders, updateReminder } from "../providers/localCrudProvider.js";
export const remindersRouter = Router();
remindersRouter.get("/", async (_req, res) => res.json(await listReminders()));
remindersRouter.post("/", async (req, res) => {
    const title = String(req.body?.title ?? "").trim();
    if (!title)
        return res.status(400).json({ message: "Reminder title is required." });
    res.status(201).json(await createReminder({ title, due: req.body?.due, urgent: Boolean(req.body?.urgent) }));
});
remindersRouter.patch("/:id", async (req, res) => {
    const item = await updateReminder(req.params.id, req.body ?? {});
    if (!item)
        return res.status(404).json({ message: "Reminder not found." });
    res.json(item);
});
remindersRouter.delete("/:id", async (req, res) => {
    const deleted = await deleteReminder(req.params.id);
    res.status(deleted ? 204 : 404).end();
});
