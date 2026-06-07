import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";

// Simple JSON-file persistence for small single-user collections (notes, todos,
// reminders, OAuth tokens). Each collection is one file under env.dataDir.
// Collection names are restricted to a safe charset to avoid path traversal.
const safeName = /^[a-z0-9_-]+$/;

function resolveFile(name: string) {
  if (!safeName.test(name)) throw new Error(`Invalid collection name: ${name}`);
  return path.join(path.resolve(env.dataDir), `${name}.json`);
}

async function ensureDataDir() {
  await fs.mkdir(path.resolve(env.dataDir), { recursive: true });
}

export async function readCollection<T>(name: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(resolveFile(name), "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  await ensureDataDir();
  const file = resolveFile(name);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

// Single-object persistence (e.g. an OAuth token blob) reusing the same dir.
export async function readObject<T>(name: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(resolveFile(name), "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeObject<T>(name: string, value: T): Promise<void> {
  await ensureDataDir();
  const file = resolveFile(name);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

export async function deleteObject(name: string): Promise<void> {
  try {
    await fs.unlink(resolveFile(name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
