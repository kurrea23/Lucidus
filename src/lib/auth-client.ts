import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SaveError } from "./sync-queue";
let client: SupabaseClient | null = null;
export function authClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Account sign-in is not available yet.");
  client = createClient(url, key);
  return client;
}
export async function accountRequest(
  path: string,
  method = "GET",
  body?: unknown,
  expectedID?: string,
) {
  const { data } = await authClient().auth.getSession();
  if (!data.session)
    throw new SaveError(401, "Your session expired. Sign in again.");
  if (expectedID && data.session.user.id !== expectedID)
    throw new SaveError(401, "Your account session changed. Sign in again.");
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw new SaveError(
      response.status,
      result.error || "The service is temporarily unavailable.",
    );
  return result;
}
