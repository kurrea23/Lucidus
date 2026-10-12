import {
  api,
  ApiError,
  appURL,
  checkoutAvailable,
  customerID,
  json,
  readJSON,
  requireUser,
  stripeClient,
  verifiedPrice,
} from "@/lib/server/backend";
import { z } from "zod";
import { createHash } from "node:crypto";
import { POLICY_RELEASE } from "@/lib/app-config";
export const runtime = "nodejs";
export const maxDuration = 60;
export function POST(request: Request) {
  return api(async () => {
    if (process.env.PAYMENTS_ENABLED !== "true")
      throw new ApiError(503, "Subscriptions are not open yet.");
    const { db, user } = await requireUser(request);
    const body = z
      .object({ interval: z.enum(["monthly", "yearly"]) })
      .strict()
      .safeParse(await readJSON(request));
    if (!body.success)
      throw new ApiError(400, "Choose monthly or yearly billing.");
    if (!(await checkoutAvailable()))
      throw new ApiError(503, "Subscriptions are not open yet.");
    const stripe = stripeClient();
    const origin = appURL();
    const price = await verifiedPrice(body.data.interval);
    let customer = await customerID(db, user.id);
    if (!customer) {
      const created = await stripe.customers.create(
        { email: user.email, metadata: { tripcooker_user_id: user.id } },
        { idempotencyKey: `tripcooker-customer-${user.id}` },
      );
      const { error } = await db
        .from("tripcooker_billing")
        .upsert(
          { user_id: user.id, customer_id: created.id },
          { onConflict: "user_id", ignoreDuplicates: true },
        );
      if (error) throw error;
      customer = await customerID(db, user.id);
      if (!customer)
        throw new ApiError(503, "Billing is temporarily unavailable.");
    }
    const lock = await db.rpc("lock_tripcooker_checkout", {
      p_user_id: user.id,
    });
    if (lock.error) throw lock.error;
    if (!lock.data)
      throw new ApiError(
        409,
        "Checkout is already being prepared. Please try again shortly.",
      );
    try {
      // Existing subscriptions, including unpaid ones, must be managed rather than bought again.
      for await (const sub of stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 100,
      })) {
        if (!["canceled", "incomplete_expired"].includes(sub.status))
          throw new ApiError(
            409,
            "You already have a subscription. Open Manage billing to change it.",
          );
      }
      let latestSession = "none";
      for await (const session of stripe.checkout.sessions.list({
        customer,
        limit: 100,
      })) {
        if (latestSession === "none") latestSession = session.id;
        if (session.status === "open" && session.mode === "subscription") {
          if (session.metadata?.interval === body.data.interval)
            return json({ url: session.url });
          await stripe.checkout.sessions.expire(session.id);
        }
      }
      const idempotencyKey = `tripcooker-checkout-${user.id}-${body.data.interval}-${latestSession}-${Math.floor(Date.now() / 600_000)}`;
      // Stable for retries of the same purchase attempt, with eight pseudorandom letters.
      const suffix = Array.from(
        createHash("sha256").update(idempotencyKey).digest().subarray(0, 8),
        (b) => String.fromCharCode(97 + (b % 26)),
      ).join("");
      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          integration_identifier: `tripcooker_${suffix}`,
          customer,
          client_reference_id: user.id,
          line_items: [{ price, quantity: 1 }],
          consent_collection: { terms_of_service: "required" },
          custom_text: {
            terms_of_service_acceptance: {
              message: `I agree to the [TripCooker Terms](${origin}/terms) and [Cancellation and refund policy](${origin}/refunds).`,
            },
          },
          success_url: `${origin}/premium?checkout=complete`,
          cancel_url: `${origin}/premium?checkout=cancelled`,
          metadata: { interval: body.data.interval, policy_version: POLICY_RELEASE.version },
          subscription_data: { metadata: { tripcooker_user_id: user.id } },
        },
        {
          idempotencyKey,
        },
      );
      if (!session.url)
        throw new ApiError(503, "Checkout is temporarily unavailable.");
      return json({ url: session.url });
    } finally {
      await db
        .from("tripcooker_billing")
        .update({ checkout_lock_until: "1970-01-01T00:00:00Z" })
        .eq("user_id", user.id);
    }
  });
}
