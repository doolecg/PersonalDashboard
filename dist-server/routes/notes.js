import { Router } from "express";
import { createNote, deleteNote, listNotes, updateNote } from "../providers/localCrudProvider.js";
export const notesRouter = Router();
notesRouter.get("/", async (_req, res) => res.json(await listNotes()));
notesRouter.post("/", async (req, res) => {
    const title = String(req.body?.title ?? "").trim();
    const preview = String(req.body?.preview ?? "").trim();
    if (!title)
        return res.status(400).json({ message: "Note title is required." });
    res.status(201).json(await createNote({ title, preview, color: String(req.body?.color ?? "blue") }));
});
notesRouter.patch("/:id", async (req, res) => {
    const item = await updateNote(req.params.id, req.body ?? {});
    if (!item)
        return res.status(404).json({ message: "Note not found." });
    res.json(item);
});
notesRouter.delete("/:id", async (req, res) => {
    const deleted = await deleteNote(req.params.id);
    res.status(deleted ? 204 : 404).end();
});
