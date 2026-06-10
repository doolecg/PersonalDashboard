import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser Supabase client. Only the public URL + anon key ever reach the
// bundle (VITE_ prefix); the service-role key stays server-side.
let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  client = url && anonKey ? createClient(url, anonKey) : null;
  return client;
}
