import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";

process.env.NEXT_PUBLIC_APP_MODE = "live";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://qa.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "qa-not-a-real-key";
process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_test_fixture";
process.env.STRIPE_MONTHLY_PRICE_ID = "price_monthly";
process.env.STRIPE_YEARLY_PRICE_ID = "price_yearly";
const { POST } = await import("../../src/app/api/billing/webhook/route");
const { planForCustomer } = await import("../../src/lib/server/backend");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const realFetch = globalThis.fetch;
let calls: string[] = [],
  receipts: Record<string, unknown>[] = [];
let invoiceStatus = "paid",
  subscriptionStatus = "active",
  knownCustomer = true,
  failWrite = false;
function mock() {
  calls = [];
  receipts = [];
  invoiceStatus = "paid";
  subscriptionStatus = "active";
  knownCustomer = true;
  failWrite = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push(url);
    const reply = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    if (url.includes("/rest/v1/tripcooker_billing?")) {
      assert.ok(url.includes("customer_id=eq.cus_own"));
      return reply(
        knownCustomer
          ? { user_id: "11111111-1111-4111-8111-111111111111" }
          : null,
      );
    }
    if (url.includes("/rest/v1/tripcooker_billing_events")) {
      if (init?.method === "POST") {
        if (failWrite)
          return reply({ message: "private database failure" }, 500);
        const record = JSON.parse(String(init.body));
        if (!receipts.some((r) => r.event_id === record.event_id))
          receipts.push(record);
        return reply([]);
      }
      const id = new URL(url).searchParams
        .get("event_id")
        ?.replace(/^eq\./, "");
      return reply(
        receipts.some((r) => r.event_id === id) ? { event_id: id } : null,
      );
    }
    if (url.includes("/v1/subscriptions"))
      return reply({
        object: "list",
        has_more: false,
        data: [
          {
            id: "sub_own",
            status: subscriptionStatus,
            latest_invoice: { id: "in_own", status: invoiceStatus },
            items: { data: [{ quantity: 1, price: { id: "price_monthly" } }] },
          },
        ],
      });
    throw new Error("Unexpected endpoint in webhook test");
  };
}
function request(
  id: string,
  type = "checkout.session.completed",
  data: Record<string, unknown> = {},
  live = false,
) {
  const payload = JSON.stringify({
    id,
    object: "event",
    type,
    livemode: live,
    data: {
      object: {
        id: "cs_own",
        customer: "cus_own",
        payment_status: "paid",
        client_reference_id: "forged-user",
        metadata: { tripcooker_user_id: "forged-user" },
        ...data,
      },
    },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  return new Request("https://tripcooker.example/api/billing/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}
test("webhooks reject unsigned, modified, stale and wrong-environment events before provider access", async () => {
  mock();
  try {
    assert.equal(
      (
        await POST(
          new Request("https://qa.example", { method: "POST", body: "{}" }),
        )
      ).status,
      400,
    );
    const valid = request("evt_tampered");
    assert.equal(
      (
        await POST(
          new Request("https://qa.example", {
            method: "POST",
            headers: valid.headers,
            body: (await valid.text()) + " ",
          }),
        )
      ).status,
      400,
    );
    const payload = JSON.stringify({ id: "evt_old" });
    const stale = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
      timestamp: Math.floor(Date.now() / 1000) - 3600,
    });
    assert.equal(
      (
        await POST(
          new Request("https://qa.example", {
            method: "POST",
            headers: { "stripe-signature": stale },
            body: payload,
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (await POST(request("evt_live", undefined, {}, true))).status,
      400,
    );
    assert.equal(calls.length, 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});
test("webhooks use server-owned customers, paid current state, durable deduplication and retry failed writes", async () => {
  mock();
  try {
    assert.equal((await POST(request("evt_paid"))).status, 200);
    assert.equal(receipts[0].plan_observed, "premium");
    assert.equal(receipts[0].user_id, "11111111-1111-4111-8111-111111111111");
    const queries = calls.filter((u) => u.includes("/v1/subscriptions")).length;
    assert.equal((await POST(request("evt_paid"))).status, 200);
    assert.equal(receipts.length, 1);
    assert.equal(
      calls.filter((u) => u.includes("/v1/subscriptions")).length,
      queries,
    );
    assert.equal(
      (
        await POST(
          request("evt_pending", undefined, { payment_status: "unpaid" }),
        )
      ).status,
      200,
    );
    assert.equal(receipts[1].plan_observed, "free");
    invoiceStatus = "open";
    assert.equal(
      await planForCustomer("cus_own"),
      "free",
      "active subscription with pending invoice must not grant Pro",
    );
    invoiceStatus = "paid";
    subscriptionStatus = "canceled";
    assert.equal(
      (
        await POST(
          request("evt_delayed_old", "customer.subscription.updated", {
            status: "active",
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      receipts[2].plan_observed,
      "free",
      "old active event cannot restore canceled access",
    );
    knownCustomer = false;
    assert.equal((await POST(request("evt_other"))).status, 200);
    assert.equal(receipts.length, 3);
    knownCustomer = true;
    failWrite = true;
    const failure = await POST(request("evt_retry", "invoice.paid"));
    assert.equal(failure.status, 503);
    assert.ok(!(await failure.text()).includes("private database"));
    failWrite = false;
    assert.equal(
      (await POST(request("evt_retry", "invoice.paid"))).status,
      200,
    );
    assert.equal(receipts.length, 4);
  } finally {
    globalThis.fetch = realFetch;
  }
});
