import "server-only";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { LIVE_MODE, PRICING } from "../app-config";
import { emptyDatabase, type DB } from "../database";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function adminDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!LIVE_MODE || !url || !key)
    throw new ApiError(503, "Account saving is not available yet.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new ApiError(503, "Billing is not available yet.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    timeout: 15_000,
    httpClient: Stripe.createFetchHttpClient(),
  });
}
export function appURL() {
  const value = process.env.APP_URL;
  if (!value) throw new ApiError(503, "Billing is not available yet.");
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new ApiError(503, "Billing is not available yet.");
  return url.origin;
}
export async function requireUser(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError(401, "Sign in to continue.");
  const db = adminDB();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user || !data.user.email_confirmed_at)
    throw new ApiError(401, "Sign in with a verified email to continue.");
  const limit = await db.rpc("allow_tripcooker_request", {
    p_user_id: data.user.id,
  });
  if (limit.error) throw limit.error;
  if (!limit.data)
    throw new ApiError(429, "Too many requests. Wait a minute and retry.");
  return { user: data.user, db };
}
export async function api(action: () => Promise<Response>): Promise<Response> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    // Never return provider errors, secrets, or raw request bodies to clients/logs.
    return json(
      {
        error:
          "The service is temporarily unavailable. Please try again.",
      },
      503,
    );
  }
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function readJSON(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send JSON data.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Missing request data.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2_000_000) {
      await reader.cancel();
      throw new ApiError(
        413,
        "Your trip data is too large to save in one request.",
      );
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, "Invalid JSON data.");
  }
}
export async function customerID(
  db: ReturnType<typeof adminDB>,
  userID: string,
) {
  const { data, error } = await db
    .from("tripcooker_billing")
    .select("customer_id")
    .eq("user_id", userID)
    .maybeSingle();
  if (error) throw error;
  return data?.customer_id as string | undefined;
}
export async function planFor(
  db: ReturnType<typeof adminDB>,
  userID: string,
): Promise<"free" | "premium"> {
  const customer = await customerID(db, userID);
  if (!customer) return "free";
  const stripe = stripeClient();
  const allowed = [
    process.env.STRIPE_MONTHLY_PRICE_ID,
    process.env.STRIPE_YEARLY_PRICE_ID,
  ].filter(Boolean);
  // Stripe is the current source of truth. No stale webhook grants or client-controlled plan values.
  for await (const sub of stripe.subscriptions.list({
    customer,
    status: "all",
    limit: 100,
  })) {
    if (
      sub.status === "active" &&
      sub.items.data.some(
        (i) => allowed.includes(i.price.id) && i.quantity === 1,
      )
    )
      return "premium";
  }
  return "free";
}
export async function loadState(
  db: ReturnType<typeof adminDB>,
  user: { id: string; email?: string; created_at: string },
) {
  const { error: initError } = await db
    .from("tripcooker_state")
    .upsert(
      {
        user_id: user.id,
        data: emptyDatabase(
          user.id,
          user.email,
          new Date(user.created_at).toISOString(),
        ),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  if (initError) throw initError;
  const { data, error } = await db
    .from("tripcooker_state")
    .select("data, version")
    .eq("user_id", user.id)
    .single();
  if (error) throw error;
  const state = data.data as DB;
  return {
    data: {
      ...state,
      user: {
        ...state.user,
        id: user.id,
        email: user.email ?? "",
        plan: await planFor(db, user.id),
      },
    },
    version: data.version as number,
  };
}
export async function verifiedPrice(interval: keyof typeof PRICING) {
  const id =
    interval === "monthly"
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;
  if (!id)
    throw new ApiError(503, "This subscription option is not available yet.");
  const price = await stripeClient().prices.retrieve(id);
  const expected = PRICING[interval];
  if (
    !price.active ||
    price.currency !== "usd" ||
    price.unit_amount !== expected.cents ||
    price.recurring?.interval !== expected.interval ||
    price.recurring?.interval_count !== 1
  )
    throw new ApiError(503, "This subscription option is not available yet.");
  return price.id;
}
