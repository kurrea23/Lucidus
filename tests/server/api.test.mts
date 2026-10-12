import test from "node:test";
import assert from "node:assert/strict";
import { emptyDatabase } from "../../src/lib/database";
process.env.NEXT_PUBLIC_APP_MODE = "live";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://qa.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "qa-not-a-real-key";
process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
process.env.STRIPE_MONTHLY_PRICE_ID = "price_monthly";
process.env.STRIPE_YEARLY_PRICE_ID = "price_yearly";
process.env.STRIPE_PORTAL_CONFIGURATION_ID = "bpc_qa";
process.env.APP_URL = "https://tripcooker.example";
process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@example.com";
process.env.NEXT_PUBLIC_APPROVED_POLICY_VERSION = "2026-10-11-v1";
const { GET, PUT } = await import("../../src/app/api/state/route");
const { POST: checkout } =
  await import("../../src/app/api/billing/checkout/route");
const { POST: portal } = await import("../../src/app/api/billing/portal/route");
const { GET: billingStatus } = await import("../../src/app/api/billing/status/route");
const ownID = "11111111-1111-4111-8111-111111111111";
const db = emptyDatabase(ownID, "qa@example.com");
let calls: { url: string; body: string; idempotencyKey: string | null }[] = [],
  rpcError = "",
  active = false,
  wrongPrice = false,
  open = false;
let openInterval = "monthly";
let payoutsEnabled = false, chargesEnabled = true, accountError = false;
let portalActive = true, portalDefault = false, portalApp = "tripcooker", portalCancelMode = "at_period_end", wrongProduct = false;
const realFetch = globalThis.fetch;
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
function installMock() {
  calls = [];
  rpcError = "";
  active = false;
  wrongPrice = false;
  open = false;
  openInterval = "monthly";
  payoutsEnabled = false;
  chargesEnabled = true;
  accountError = false;
  portalActive = true;
  portalDefault = false;
  portalApp = "tripcooker";
  portalCancelMode = "at_period_end";
  wrongProduct = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = String(init?.body ?? "");
    calls.push({
      url,
      body,
      idempotencyKey: new Headers(init?.headers).get("idempotency-key"),
    });
    if (url.endsWith("/v1/account"))
      return accountError
        ? response({ error: { message: "private provider details", type: "invalid_request_error" } }, 403)
        : response({ id: "acct_qa", charges_enabled: chargesEnabled, payouts_enabled: payoutsEnabled });
    if (url.includes("/auth/v1/user")) {
      const token = new Headers(init?.headers).get("Authorization");
      return token === "Bearer valid"
        ? response({
            id: ownID,
            email: "qa@example.com",
            email_confirmed_at: "2026-01-01T00:00:00Z",
            created_at: db.user.createdAt,
          })
        : response({ message: "invalid token" }, 401);
    }
    if (url.includes("/rest/v1/tripcooker_state"))
      return init?.method === "POST"
        ? response([])
        : response({ data: db, version: 0 });
    if (url.includes("/rest/v1/tripcooker_billing"))
      return response({ customer_id: "cus_own" });
    if (url.includes("/rest/v1/rpc/allow_tripcooker_request"))
      return response(true);
    if (url.includes("/rest/v1/rpc/lock_tripcooker_checkout"))
      return response(true);
    if (url.includes("/rest/v1/rpc/save_tripcooker_state"))
      return rpcError
        ? response({ code: "P0001", message: rpcError }, 400)
        : response(1);
    if (url.includes("/v1/prices/"))
      return response({
        id: wrongPrice
          ? "price_wrong"
          : url.includes("price_yearly")
            ? "price_yearly"
            : "price_monthly",
        object: "price",
        product: { id: "prod_qa", active: true, metadata: { app: wrongProduct ? "other" : "tripcooker" } },
        active: true,
        currency: "usd",
        unit_amount: wrongPrice
          ? 1999
          : url.includes("price_yearly")
            ? 5900
            : 799,
        recurring: {
          interval: url.includes("price_yearly") ? "year" : "month",
          interval_count: 1,
        },
      });
    if (url.includes("/v1/subscriptions"))
      return response({
        object: "list",
        has_more: false,
        data: active
          ? [
              {
                id: "sub_1",
                status: "active",
                latest_invoice: { id: "in_1", status: "paid" },
                items: {
                  data: [{ quantity: 1, price: { id: "price_monthly" } }],
                },
              },
            ]
          : [],
      });
    if (url.includes("/v1/checkout/sessions")) {
      if (url.endsWith("/expire")) {
        open = false;
        return response({ id: "cs_qa", status: "expired" });
      }
      if (init?.method === "POST") {
        open = true;
        openInterval = new URLSearchParams(body).get("metadata[interval]")!;
        return response({
          id: "cs_qa",
          url: "https://checkout.stripe.com/qa",
          status: "open",
        });
      }
      return response({
        object: "list",
        has_more: false,
        data: open
          ? [
              {
                id: "cs_qa",
                mode: "subscription",
                status: "open",
                url: "https://checkout.stripe.com/qa",
                metadata: { interval: openInterval },
              },
            ]
          : [],
      });
    }
    if (url.includes("/v1/billing_portal/configurations/"))
      return response({ id: "bpc_qa", active: portalActive, is_default: portalDefault, metadata: { app: portalApp }, features: { subscription_cancel: { enabled: true, mode: portalCancelMode } } });
    if (url.includes("/v1/billing_portal/sessions"))
      return response({ url: "https://billing.stripe.com/qa" });
    throw new Error("Unexpected mocked endpoint: " + url);
  };
}
function req(method = "GET", data?: unknown, token = "valid") {
  return new Request("https://tripcooker.example/api/state", {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      "content-type": "application/json",
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
test("server API verifies identity, overwrites forged plan, and safely handles invalid writes", async () => {
  installMock();
  try {
    assert.equal((await GET(req("GET", undefined, ""))).status, 401);
    assert.equal(calls.length, 0);
    assert.equal((await GET(req("GET", undefined, "bad"))).status, 401);
    const valid = await GET(req());
    assert.equal(valid.status, 200);
    assert.equal((await valid.json()).data.user.plan, "free");
    const forged = {
      ...db,
      user: {
        ...db.user,
        id: "someone-else",
        email: "other@example.com",
        plan: "premium",
      },
    };
    const saved = await PUT(req("PUT", { data: forged, version: 0 }));
    assert.equal(saved.status, 200);
    const payload = JSON.parse(
      calls.findLast((c) => c.url.includes("/rpc/"))!.body,
    );
    assert.equal(payload.p_user_id, ownID);
    assert.equal(payload.p_data.user.id, ownID);
    assert.equal(payload.p_data.user.plan, "free");
    assert.equal(payload.p_premium, false);
    assert.equal(
      (await PUT(req("PUT", { data: { ...db, trips: "bad" }, version: 0 })))
        .status,
      400,
    );
    rpcError = "state_conflict";
    assert.equal((await PUT(req("PUT", { data: db, version: 0 }))).status, 409);
    rpcError = "premium_required";
    assert.equal((await PUT(req("PUT", { data: db, version: 0 }))).status, 403);
    rpcError = "private database error with credentials";
    const failure = await PUT(req("PUT", { data: db, version: 0 }));
    assert.equal(failure.status, 503);
    assert.ok(!(await failure.text()).includes("credentials"));
  } finally {
    globalThis.fetch = realFetch;
  }
});
test("live checkout requires enabled charges and payouts, fails closed, and preserves billing management", async () => {
  installMock();
  process.env.PAYMENTS_ENABLED = "true";
  process.env.STRIPE_SECRET_KEY = "sk_live_not_a_real_key";
  try {
    const paused = await checkout(req("POST", { interval: "monthly" }));
    assert.equal(paused.status, 503);
    assert.ok(!(await paused.text()).includes("private"));
    assert.ok(!calls.some((c) => c.url.includes("/checkout/sessions")));
    assert.ok(!calls.some((c) => c.url.includes("/v1/customers")));
    assert.deepEqual(await (await billingStatus(req())).json(), { canManage: true, checkoutAvailable: false });
    assert.equal((await portal(req("POST"))).status, 200);
    payoutsEnabled = true;
    chargesEnabled = false;
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    chargesEnabled = true;
    accountError = true;
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    assert.equal((await (await billingStatus(req())).json()).checkoutAvailable, false);
    accountError = false;
    process.env.NEXT_PUBLIC_APPROVED_POLICY_VERSION = "old-policy";
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    process.env.NEXT_PUBLIC_APPROVED_POLICY_VERSION = "2026-10-11-v1";
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "";
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@example.com";
    assert.equal((await (await billingStatus(req())).json()).checkoutAvailable, true);
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 200);
    // Invalid credentials must not be treated as sandbox access.
    process.env.STRIPE_SECRET_KEY = "not_a_stripe_key";
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
    process.env.TRIPCOOKER_FREE_LAUNCH = "true";
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    assert.equal((await (await billingStatus(req())).json()).checkoutAvailable, false);
  } finally {
    delete process.env.TRIPCOOKER_FREE_LAUNCH;
    process.env.NEXT_PUBLIC_APPROVED_POLICY_VERSION = "2026-10-11-v1";
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = "support@example.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_key";
    globalThis.fetch = realFetch;
  }
});
test("changing billing interval replaces the open session without reusing its Stripe idempotency key", async () => {
  installMock();
  process.env.PAYMENTS_ENABLED = "true";
  try {
    assert.equal(
      (await checkout(req("POST", { interval: "monthly" }))).status,
      200,
    );
    assert.equal(
      (await checkout(req("POST", { interval: "yearly" }))).status,
      200,
    );
    const created = calls.filter(
      (c) => c.url.endsWith("/checkout/sessions") && c.body,
    );
    assert.equal(created.length, 2);
    assert.ok(calls.some((c) => c.url.endsWith("/expire")));
    assert.notEqual(created[0].idempotencyKey, created[1].idempotencyKey);
    assert.equal(
      new URLSearchParams(created[1].body).get("line_items[0][price]"),
      "price_yearly",
    );
    assert.equal(new URLSearchParams(created[1].body).get("consent_collection[terms_of_service]"), "required");
    assert.equal(new URLSearchParams(created[1].body).get("metadata[policy_version]"), "2026-10-11-v1");
    assert.match(new URLSearchParams(created[1].body).get("custom_text[terms_of_service_acceptance][message]")!, /TripCooker Terms.*https:\/\/tripcooker\.example\/terms.*https:\/\/tripcooker\.example\/refunds/);
    assert.match(
      new URLSearchParams(created[1].body).get("integration_identifier")!,
      /^tripcooker_[a-z]{8}$/,
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});
test("billing uses configured price and owned customer, reuses checkout and rejects duplicate subscriptions", async () => {
  installMock();
  try {
    process.env.PAYMENTS_ENABLED = "false";
    assert.equal(
      (await checkout(req("POST", { interval: "monthly" }))).status,
      503,
    );
    process.env.PAYMENTS_ENABLED = "true";
    assert.equal(
      (
        await checkout(
          req("POST", { interval: "monthly", customer: "cus_other" }),
        )
      ).status,
      400,
    );
    wrongPrice = true;
    assert.equal(
      (await checkout(req("POST", { interval: "monthly" }))).status,
      503,
    );
    wrongPrice = false;
    wrongProduct = true;
    assert.equal((await checkout(req("POST", { interval: "monthly" }))).status, 503);
    wrongProduct = false;
    assert.equal(
      (await checkout(req("POST", { interval: "monthly" }))).status,
      200,
    );
    const created = calls.filter(
      (c) => c.url.includes("/checkout/sessions") && c.body,
    ).length;
    assert.equal(created, 1);
    const body = new URLSearchParams(
      calls.find((c) => c.url.includes("/checkout/sessions") && c.body)!.body,
    );
    assert.equal(body.get("customer"), "cus_own");
    assert.equal(body.get("line_items[0][price]"), "price_monthly");
    assert.ok(
      body.get("success_url")!.startsWith("https://tripcooker.example/"),
    );
    assert.equal(
      (await checkout(req("POST", { interval: "monthly" }))).status,
      200,
    );
    assert.equal(
      calls.filter((c) => c.url.includes("/checkout/sessions") && c.body)
        .length,
      1,
    );
    active = true;
    assert.equal(
      (await checkout(req("POST", { interval: "monthly" }))).status,
      409,
    );
    const state = await GET(req());
    assert.equal((await state.json()).data.user.plan, "premium");
    const managed = await portal(req("POST"));
    assert.equal(managed.status, 200);
    assert.equal(
      new URLSearchParams(
        calls.findLast((c) => c.url.includes("/billing_portal/"))!.body,
      ).get("customer"),
      "cus_own",
    );
    assert.equal(new URLSearchParams(calls.findLast((c) => c.url.includes("/billing_portal/sessions"))!.body).get("configuration"), "bpc_qa");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("billing management rejects the shared default, inactive or foreign portals and unsupported cancellation rules", async () => {
  installMock();
  try {
    portalDefault = true;
    assert.equal((await portal(req("POST"))).status, 503);
    portalDefault = false;
    portalActive = false;
    assert.equal((await portal(req("POST"))).status, 503);
    portalActive = true;
    portalApp = "other-business";
    assert.equal((await portal(req("POST"))).status, 503);
    portalApp = "tripcooker";
    portalCancelMode = "immediately";
    assert.equal((await portal(req("POST"))).status, 503);
    portalCancelMode = "at_period_end";
    delete process.env.STRIPE_PORTAL_CONFIGURATION_ID;
    assert.equal((await portal(req("POST"))).status, 503);
    assert.ok(!calls.some((c) => c.url.includes("/billing_portal/sessions")));
    process.env.STRIPE_PORTAL_CONFIGURATION_ID = "bpc_qa";
    assert.equal((await portal(req("POST"))).status, 200);
  } finally {
    process.env.STRIPE_PORTAL_CONFIGURATION_ID = "bpc_qa";
    globalThis.fetch = realFetch;
  }
});
