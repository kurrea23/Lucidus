import type Stripe from "stripe";
import {
  adminDB,
  api,
  ApiError,
  json,
  planForCustomer,
  readBody,
  stripeClient,
} from "@/lib/server/backend";

export const runtime = "nodejs";
export const maxDuration = 60;
const events = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export function POST(request: Request) {
  return api(async () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret)
      throw new ApiError(503, "Billing notifications are not configured.");
    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new ApiError(400, "Invalid billing notification.");
    const stripe = stripeClient();
    const body = await readBody(request);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(body),
        signature,
        secret,
      );
    } catch {
      throw new ApiError(400, "Invalid billing notification.");
    }
    const live = /^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY ?? "");
    if (event.livemode !== live)
      throw new ApiError(400, "Invalid billing environment.");
    if (!events.has(event.type)) return json({ received: true });

    const object = event.data.object as
      Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice;
    const customer =
      typeof object.customer === "string"
        ? object.customer
        : object.customer?.id;
    if (!customer) return json({ received: true });
    const db = adminDB();
    // Customer ownership comes from our mapping, never event metadata or client_reference_id.
    const owner = await db
      .from("tripcooker_billing")
      .select("user_id")
      .eq("customer_id", customer)
      .maybeSingle();
    if (owner.error) throw owner.error;
    if (!owner.data) return json({ received: true });
    const previous = await db
      .from("tripcooker_billing_events")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();
    if (previous.error) throw previous.error;
    if (previous.data) return json({ received: true });

    const pendingCheckout =
      event.type.startsWith("checkout.session.") &&
      (object as Stripe.Checkout.Session).payment_status !== "paid";
    // Re-read Stripe instead of granting from delayed/out-of-order event snapshots.
    // Account APIs independently use the same current paid-invoice check for access.
    const plan = pendingCheckout ? "free" : await planForCustomer(customer);
    const saved = await db.from("tripcooker_billing_events").upsert(
      {
        event_id: event.id,
        user_id: owner.data.user_id,
        event_type: event.type,
        plan_observed: plan,
      },
      { onConflict: "event_id", ignoreDuplicates: true },
    );
    if (saved.error) throw saved.error; // Non-2xx makes Stripe retry; never acknowledge a lost receipt.
    return json({ received: true });
  });
}
