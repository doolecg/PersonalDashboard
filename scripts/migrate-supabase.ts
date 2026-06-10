/**
 * Migrate existing local JSON data (./data/*.json) into the Supabase aura_kv
 * table for one user.
 *
 * Usage:
 *   npx tsx scripts/migrate-supabase.ts --email you@example.com [--force]
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env. The target user
 * must already exist in Supabase Auth (sign up once through the login screen
 * first). Without --force, collections that already have data in Supabase are
 * skipped so an accidental re-run can't overwrite newer synced data.
 */
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const COLLECTIONS = ["todos", "notes", "reminders", "events"];
const LIST_KEY = "__list__";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const table = process.env.SUPABASE_KV_TABLE ?? "aura_kv";
  const dataDir = path.resolve(process.env.DATA_DIR ?? "./data");
  const email = (arg("email") ?? "").toLowerCase();
  const force = process.argv.includes("--force");

  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
    process.exit(1);
  }
  if (!email) {
    console.error("Usage: npx tsx scripts/migrate-supabase.ts --email you@example.com [--force]");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Resolve the target user id from the email.
  const { data: users, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (userError) {
    console.error(`Could not list users: ${userError.message}`);
    process.exit(1);
  }
  const user = users.users.find((candidate) => (candidate.email ?? "").toLowerCase() === email);
  if (!user) {
    console.error(`No Supabase user found with email ${email}. Sign up through the Aura login screen first.`);
    process.exit(1);
  }

  console.log(`Migrating local data from ${dataDir} to user ${email} (${user.id})\n`);

  let migrated = 0;
  for (const collection of COLLECTIONS) {
    const file = path.join(dataDir, `${collection}.json`);
    let items: unknown;
    try {
      items = JSON.parse(await fs.readFile(file, "utf-8"));
    } catch {
      console.log(`- ${collection}: no local file, skipped`);
      continue;
    }
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`- ${collection}: empty, skipped`);
      continue;
    }

    if (!force) {
      const { data: existing, error } = await supabase
        .from(table)
        .select("id")
        .eq("user_id", user.id)
        .eq("collection", collection)
        .eq("key", LIST_KEY)
        .maybeSingle();
      if (error) {
        console.error(`- ${collection}: read check failed (${error.message})`);
        continue;
      }
      if (existing) {
        console.log(`- ${collection}: already has data in Supabase, skipped (use --force to overwrite)`);
        continue;
      }
    }

    const { error: writeError } = await supabase
      .from(table)
      .upsert(
        { user_id: user.id, collection, key: LIST_KEY, value: items, updated_at: new Date().toISOString() },
        { onConflict: "user_id,collection,key" }
      );
    if (writeError) {
      console.error(`- ${collection}: write failed (${writeError.message})`);
      continue;
    }
    console.log(`- ${collection}: migrated ${items.length} item(s)`);
    migrated += 1;
  }

  console.log(`\nDone. ${migrated} collection(s) migrated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
