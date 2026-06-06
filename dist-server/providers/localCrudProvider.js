import { providerResult } from "./providerResult.js";
const reminders = new Map();
const notes = new Map();
export async function listReminders() {
    const data = [...reminders.values()];
    return providerResult(data.length ? "ok" : "empty", data);
}
export async function createReminder(input) {
    const item = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        due: input.due,
        urgent: Boolean(input.urgent),
        completed: false,
        createdAt: new Date().toISOString()
    };
    reminders.set(item.id, item);
    return item;
}
export async function updateReminder(id, patch) {
    const current = reminders.get(id);
    if (!current)
        return null;
    const next = { ...current, ...patch, id };
    reminders.set(id, next);
    return next;
}
export async function deleteReminder(id) {
    return reminders.delete(id);
}
export async function listNotes() {
    const data = [...notes.values()];
    return providerResult(data.length ? "ok" : "empty", data);
}
export async function createNote(input) {
    const item = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        preview: input.preview.trim(),
        color: input.color || "blue",
        updatedAt: new Date().toISOString()
    };
    notes.set(item.id, item);
    return item;
}
export async function updateNote(id, patch) {
    const current = notes.get(id);
    if (!current)
        return null;
    const next = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
    notes.set(id, next);
    return next;
}
export async function deleteNote(id) {
    return notes.delete(id);
}
