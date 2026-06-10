import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
// Server-side Supabase clients. The service-role client must never leave this
// process — only VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY reach the browser.
let serviceClient;
let authClient;
export function isSupabaseConfigured() {
    return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
export function isSupabaseAuthConfigured() {
    return Boolean(env.supabaseUrl && (env.supabaseServiceRoleKey || env.supabaseAnonKey));
}
/** Service-role client for user-scoped storage (RLS bypass; queries always filter by user_id). */
export function getSupabaseAdmin() {
    if (serviceClient !== undefined)
        return serviceClient;
    serviceClient = isSupabaseConfigured()
        ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })
        : null;
    return serviceClient;
}
/** Client used only to validate user access tokens (anon key is sufficient). */
export function getSupabaseAuthClient() {
    if (authClient !== undefined)
        return authClient;
    const key = env.supabaseServiceRoleKey || env.supabaseAnonKey;
    authClient = env.supabaseUrl && key
        ? createClient(env.supabaseUrl, key, { auth: { autoRefreshToken: false, persistSession: false } })
        : null;
    return authClient;
}
