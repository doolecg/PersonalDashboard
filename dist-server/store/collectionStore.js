import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";
// Simple JSON-file persistence for small single-user collections (notes, todos,
// reminders, OAuth tokens). Each collection is one file under env.dataDir.
// Collection names are restricted to a safe charset to avoid path traversal.
const safeName = /^[a-z0-9_-]+$/;
function resolveFile(name) {
    if (!safeName.test(name))
        throw new Error(`Invalid collection name: ${name}`);
    return path.join(path.resolve(env.dataDir), `${name}.json`);
}
async function ensureDataDir() {
    await fs.mkdir(path.resolve(env.dataDir), { recursive: true });
}
export async function readCollection(name) {
    try {
        const raw = await fs.readFile(resolveFile(name), "utf-8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (error) {
        if (error.code === "ENOENT")
            return [];
        throw error;
    }
}
export async function writeCollection(name, items) {
    await ensureDataDir();
    const file = resolveFile(name);
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf-8");
    await fs.rename(tmp, file);
}
// Single-object persistence (e.g. an OAuth token blob) reusing the same dir.
export async function readObject(name) {
    try {
        const raw = await fs.readFile(resolveFile(name), "utf-8");
        return JSON.parse(raw);
    }
    catch (error) {
        if (error.code === "ENOENT")
            return null;
        throw error;
    }
}
export async function writeObject(name, value) {
    await ensureDataDir();
    const file = resolveFile(name);
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
    await fs.rename(tmp, file);
}
export async function deleteObject(name) {
    try {
        await fs.unlink(resolveFile(name));
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
    }
}
