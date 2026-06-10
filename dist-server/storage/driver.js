import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../supabase.js";
import { readCollection, writeCollection } from "../store/collectionStore.js";
const safeName = /^[a-z0-9_-]+$/;
const LIST_KEY = "__list__";
function assertSafe(name, kind) {
    if (!safeName.test(name))
        throw new Error(`Invalid ${kind}: ${name}`);
}
// --- JSON driver (dev fallback) -------------------------------------------
// The legacy single-user files (./data/<collection>.json) are used for the
// "local" dev user so existing data keeps working; other users get a subdir.
function userFile(userId, collection, key) {
    assertSafe(collection, "collection");
    assertSafe(key, "key");
    const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, "_");
    return path.join(path.resolve(env.dataDir), "users", safeUser, `${collection}.${key}.json`);
}
async function readJsonFile(file) {
    try {
        return JSON.parse(await fs.readFile(file, "utf-8"));
    }
    catch (error) {
        if (error.code === "ENOENT")
            return null;
        throw error;
    }
}
async function writeJsonFile(file, value) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
    await fs.rename(tmp, file);
}
const jsonDriver = {
    name: "json",
    async list(userId, collection) {
        if (userId === "local")
            return readCollection(collection);
        return (await readJsonFile(userFile(userId, collection, LIST_KEY))) ?? [];
    },
    async replaceCollection(userId, collection, items) {
        if (userId === "local")
            return writeCollection(collection, items);
        await writeJsonFile(userFile(userId, collection, LIST_KEY), items);
    },
    async getObject(userId, collection, key) {
        return readJsonFile(userFile(userId, collection, key));
    },
    async setObject(userId, collection, key, value) {
        await writeJsonFile(userFile(userId, collection, key), value);
    },
    async deleteObject(userId, collection, key) {
        try {
            await fs.unlink(userFile(userId, collection, key));
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
    }
};
// --- Supabase driver --------------------------------------------------------
// Whole collections are stored as a single KV row (collection + "__list__"),
// matching the existing replace-wholesale REST contract; objects use their key.
// The service-role client bypasses RLS, so every query filters by user_id.
function admin() {
    const client = getSupabaseAdmin();
    if (!client)
        throw new Error("Supabase storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    return client;
}
const supabaseDriver = {
    name: "supabase",
    async list(userId, collection) {
        assertSafe(collection, "collection");
        const { data, error } = await admin()
            .from(env.supabaseKvTable)
            .select("value")
            .eq("user_id", userId)
            .eq("collection", collection)
            .eq("key", LIST_KEY)
            .maybeSingle();
        if (error)
            throw new Error(`Supabase read failed: ${error.message}`);
        return Array.isArray(data?.value) ? data.value : [];
    },
    async replaceCollection(userId, collection, items) {
        assertSafe(collection, "collection");
        const { error } = await admin()
            .from(env.supabaseKvTable)
            .upsert({ user_id: userId, collection, key: LIST_KEY, value: items, updated_at: new Date().toISOString() }, { onConflict: "user_id,collection,key" });
        if (error)
            throw new Error(`Supabase write failed: ${error.message}`);
    },
    async getObject(userId, collection, key) {
        assertSafe(collection, "collection");
        assertSafe(key, "key");
        const { data, error } = await admin()
            .from(env.supabaseKvTable)
            .select("value")
            .eq("user_id", userId)
            .eq("collection", collection)
            .eq("key", key)
            .maybeSingle();
        if (error)
            throw new Error(`Supabase read failed: ${error.message}`);
        return data?.value ?? null;
    },
    async setObject(userId, collection, key, value) {
        assertSafe(collection, "collection");
        assertSafe(key, "key");
        const { error } = await admin()
            .from(env.supabaseKvTable)
            .upsert({ user_id: userId, collection, key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,collection,key" });
        if (error)
            throw new Error(`Supabase write failed: ${error.message}`);
    },
    async deleteObject(userId, collection, key) {
        assertSafe(collection, "collection");
        assertSafe(key, "key");
        const { error } = await admin()
            .from(env.supabaseKvTable)
            .delete()
            .eq("user_id", userId)
            .eq("collection", collection)
            .eq("key", key);
        if (error)
            throw new Error(`Supabase delete failed: ${error.message}`);
    }
};
// --- Selection + sync status -------------------------------------------------
let lastSyncAt = null;
let lastSyncError = null;
export function getStorageDriver() {
    if (env.storageDriver === "json")
        return jsonDriver;
    if (isSupabaseConfigured())
        return supabaseDriver;
    if (env.nodeEnv === "production") {
        // Misconfiguration must be loud in production, not a silent local fallback.
        throw new Error("AURA_STORAGE_DRIVER=supabase but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing.");
    }
    logger.dedupedWarn("storage:fallback", "Supabase storage not configured; using local JSON driver (development only)");
    return jsonDriver;
}
/** Wraps driver calls to track last-sync state for the status endpoints. */
export async function withSyncTracking(operation) {
    try {
        const result = await operation();
        lastSyncAt = new Date().toISOString();
        lastSyncError = null;
        return result;
    }
    catch (error) {
        lastSyncError = error instanceof Error ? error.message : String(error);
        throw error;
    }
}
export function getSyncStatus() {
    const driver = (() => {
        try {
            return getStorageDriver().name;
        }
        catch {
            return "unconfigured";
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
