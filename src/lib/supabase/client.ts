import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cloud mode is optional: when NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are not
 * set at build time, the app runs in local demo mode exactly as before.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isCloudEnabled(): boolean {
  return Boolean(url && anonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
