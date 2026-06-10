import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase.js";
import { readCollection, writeCollection } from "../store/collectionStore.js";

// User-scoped storage abstraction. "supabase" is the production driver (synced
// across devices via the aura_kv table); "json" is the development/migration
// fallback writing per-user files under env.dataDir.
export type StorageDriver = {
  name: "supabase" | "json";
  list<T>(userId: string, collection: string): Promise<T[]>;
  replaceCollection<T>(userId: string, collection: string, items: T[]): Promise<void>;
  getObject<T>(userId: string, collection: string, key: string): Promise<T | null>;
  setObject<T>(userId: string, collection: string, key: string, value: T): Promise<void>;
  deleteObject(userId: string, collection: string, key: string): Promise<void>;
};

const safeName = /^[a-z0-9_-]+$/;
const LIST_KEY = "__list__";

function assertSafe(name: string, kind: string) {
  if (!safeName.test(name)) throw new Error(`Invalid ${kind}: ${name}`);
}

// --- JSON driver (dev fallback) -------------------------------------------
// The legacy single-user files (./data/<collection>.json) are used for the
// "local" dev user so existing data keeps working; other users get a subdir.

function userFile(userId: string, collection: string, key: string) {
  assertSafe(collection, "collection");
  assertSafe(key, "key");
  const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, "_");
  return path.join(path.resolve(env.dataDir), "users", safeUser, `${collection}.${key}.json`);
}

async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJsonFile(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

const jsonDriver: StorageDriver = {
  name: "json",
  async list<T>(userId: string, collection: string): Promise<T[]> {
    if (userId === "local") return readCollection<T>(collection);
    return (await readJsonFile<T[]>(userFile(userId, collection, LIST_KEY))) ?? [];
  },
  async replaceCollection<T>(userId: string, collection: string, items: T[]): Promise<void> {
    if (userId === "local") return writeCollection(collection, items);
    await writeJsonFile(userFile(userId, collection, LIST_KEY), items);
  },
  async getObject<T>(userId: string, collection: string, key: string): Promise<T | null> {
    return readJsonFile<T>(userFile(userId, collection, key));
  },
  async setObject<T>(userId: string, collection: string, key: string, value: T): Promise<void> {
    await writeJsonFile(userFile(userId, collection, key), value);
  },
  async deleteObject(userId: string, collection: string, key: string): Promise<void> {
    try {
      await fs.unlink(userFile(userId, collection, key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
};

// --- Supabase driver --------------------------------------------------------
// Whole collections are stored as a single KV row (collection + "__list__"),
// matching the existing replace-wholesale REST contract; objects use their key.
// The service-role client bypasses RLS, so every query filters by user_id.

function admin() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return client;
}

const supabaseDriver: StorageDriver = {
  name: "supabase",
  async list<T>(userId: string, collection: string): Promise<T[]> {
    assertSafe(collection, "collection");
    const { data, error } = await admin()
      .from(env.supabaseKvTable)
      .select("value")
      .eq("user_id", userId)
      .eq("collection", collection)
      .eq("key", LIST_KEY)
      .maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return Array.isArray(data?.value) ? (data.value as T[]) : [];
  },
  async replaceCollection<T>(userId: string, collection: string, items: T[]): Promise<void> {
    assertSafe(collection, "collection");
    const { error } = await admin()
      .from(env.supabaseKvTable)
      .upsert(
        { user_id: userId, collection, key: LIST_KEY, value: items, updated_at: new Date().toISOString() },
        { onConflict: "user_id,collection,key" }
      );
    if (error) throw new Error(`Supabase write failed: ${error.message}`);
  },
  async getObject<T>(userId: string, collection: string, key: string): Promise<T | null> {
    assertSafe(collection, "collection");
    assertSafe(key, "key");
    const { data, error } = await admin()
      .from(env.supabaseKvTable)
      .select("value")
      .eq("user_id", userId)
      .eq("collection", collection)
      .eq("key", key)
      .maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return (data?.value as T) ?? null;
  },
  async setObject<T>(userId: string, collection: string, key: string, value: T): Promise<void> {
    assertSafe(collection, "collection");
    assertSafe(key, "key");
    const { error } = await admin()
      .from(env.supabaseKvTable)
      .upsert(
        { user_id: userId, collection, key, value, updated_at: new Date().toISOString() },
        { onConflict: "user_id,collection,key" }
      );
    if (error) throw new Error(`Supabase write failed: ${error.message}`);
  },
  async deleteObject(userId: string, collection: string, key: string): Promise<void> {
    assertSafe(collection, "collection");
    assertSafe(key, "key");
    const { error } = await admin()
      .from(env.supabaseKvTable)
      .delete()
      .eq("user_id", userId)
      .eq("collection", collection)
      .eq("key", key);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }
};

// --- Selection + sync status -------------------------------------------------

let lastSyncAt: string | null = null;
let lastSyncError: string | null = null;

export function getStorageDriver(): StorageDriver {
  if (env.storageDriver === "json") return jsonDriver;
  if (isSupabaseConfigured()) return supabaseDriver;
  if (env.nodeEnv === "production") {
    // Misconfiguration must be loud in production, not a silent local fallback.
    throw new Error(
      "AURA_STORAGE_DRIVER=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing."
    );
  }
  logger.dedupedWarn("storage:fallback", "Supabase storage not configured; using local JSON driver (development only)");
  return jsonDriver;
}

/** Wraps driver calls to track last-sync state for the status endpoints. */
export async function withSyncTracking<T>(operation: () => Promise<T>): Promise<T> {
  try {
    const result = await operation();
    lastSyncAt = new Date().toISOString();
    lastSyncError = null;
    return result;
  } catch (error) {
    lastSyncError = error instanceof Error ? error.message : String(error);
    throw error;
  }
}

export function getSyncStatus() {
  const driver = (() => {
    try {
      return getStorageDriver().name;
    } catch {
      return "unconfigured" as const;
    }
  })();
  return {
    driver,
    supabaseConfigured: isSupabaseConfigured(),
    lastSyncAt,
    lastSyncError,
    online: driver === "supabase" ? lastSyncError === null : true
  };
}
