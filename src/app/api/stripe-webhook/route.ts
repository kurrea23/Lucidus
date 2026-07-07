import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Stripe webhook: the single source of truth for who has Premium.
 * checkout completed → plan = premium; subscription canceled → plan = free.
 * Uses the Supabase service-role key (server-only) to update users.plan.
 */
export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return Response.json({ error: "payments_not_configured" }, { status: 501 });
  }

  const stripe = new Stripe(stripeKey);
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature ?? "", webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
      if (userId) {
        await admin
          .from("users")
          .update({
            plan: "premium",
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const active =
        event.type !== "customer.subscription.deleted" &&
        (sub.status === "active" || sub.status === "trialing");
      const plan = active ? "premium" : "free";
      const userId = sub.metadata?.supabase_user_id;
      if (userId) {
        await admin.from("users").update({ plan }).eq("id", userId);
      } else if (typeof sub.customer === "string") {
        await admin.from("users").update({ plan }).eq("stripe_customer_id", sub.customer);
      }
      break;
    }
  }

  return Response.json({ received: true });
}
