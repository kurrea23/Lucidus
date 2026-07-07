import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Creates a Stripe subscription checkout session for the signed-in user.
 * Returns 501 until Stripe env vars are configured, so the app can ship
 * before payments are switched on.
 */
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceMonthly = process.env.STRIPE_PRICE_ID_MONTHLY;
  const priceYearly = process.env.STRIPE_PRICE_ID_YEARLY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!stripeKey || (!priceMonthly && !priceYearly) || !supabaseUrl || !supabaseAnon) {
    return Response.json({ error: "payments_not_configured" }, { status: 501 });
  }

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return Response.json({ error: "not_authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnon);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { interval?: string };
  const price = body.interval === "yearly" ? priceYearly : priceMonthly;
  if (!price) {
    return Response.json({ error: "price_not_configured" }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/premium?success=1`,
    cancel_url: `${origin}/premium?canceled=1`,
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata: { supabase_user_id: user.id },
    subscription_data: { metadata: { supabase_user_id: user.id } },
  });

  return Response.json({ url: session.url });
}
