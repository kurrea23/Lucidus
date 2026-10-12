import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { readFileSync } from "node:fs";
const policyVersion = JSON.parse(readFileSync("src/lib/policy-release.json", "utf8")).version;

test("production hosts refuse an unconfigured or payment-disabled release", () => {
  for (const target of [
    { VERCEL_ENV: "production" },
    { RAILWAY_ENVIRONMENT_NAME: "production" },
    { TRIPCOOKER_RELEASE_TARGET: "production" },
  ]) {
    const result = spawnSync(process.execPath, ["scripts/prebuild.mjs"], {
      env: { ...target, NODE_ENV: "test", PATH: process.env.PATH },
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /NEXT_PUBLIC_APP_MODE=live/);
    assert.match(result.stderr, /Payments are disabled/);
  }
});

test("staging and local builds can run the labeled demo without enabling payments", () => {
  const result = spawnSync(process.execPath, ["scripts/prebuild.mjs"], {
    env: {
      RAILWAY_ENVIRONMENT_NAME: "staging",
      NODE_ENV: "test",
      PATH: process.env.PATH,
    },
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
});

test("production requires reviewed current policies, a support address, and live billing configuration", () => {
  const configured = {
    NODE_ENV: "test" as const,
    PATH: process.env.PATH,
    NEXT_PUBLIC_APP_MODE: "live",
    NEXT_PUBLIC_SUPABASE_URL: "https://qa.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "not-a-real-key",
    SUPABASE_SERVICE_ROLE_KEY: "not-a-real-key",
    APP_URL: "https://tripcooker.com",
    STRIPE_SECRET_KEY: "sk_live_not_a_real_key",
    STRIPE_WEBHOOK_SECRET: "whsec_not_a_real_key",
    STRIPE_MONTHLY_PRICE_ID: "price_monthly",
    STRIPE_YEARLY_PRICE_ID: "price_yearly",
    STRIPE_PORTAL_CONFIGURATION_ID: "bpc_fixture",
    PAYMENTS_ENABLED: "true",
    NEXT_PUBLIC_SUPPORT_EMAIL: "support@example.com",
    NEXT_PUBLIC_APPROVED_POLICY_VERSION: policyVersion,
  };
  const check = (overrides: Record<string, string>) => spawnSync(process.execPath, ["scripts/check-launch.mjs"], {
    env: { ...configured, ...overrides }, encoding: "utf8",
  });
  assert.equal(check({}).status, 0);
  const draft = check({ NEXT_PUBLIC_APPROVED_POLICY_VERSION: "old-policy" });
  assert.equal(draft.status, 1);
  assert.match(draft.stderr, /Approve the current policy version/);
  const noSupport = check({ NEXT_PUBLIC_SUPPORT_EMAIL: "" });
  assert.equal(noSupport.status, 1);
  assert.match(noSupport.stderr, /verified public support address/);
  const sandbox = check({ STRIPE_SECRET_KEY: "sk_test_not_a_real_key" });
  assert.equal(sandbox.status, 1);
  assert.match(sandbox.stderr, /live Stripe key/);
  assert.ok(!sandbox.stderr.includes("sk_test_not_a_real_key"));
});

test("explicit Free production launch still requires live accounts and reviewed policies, with payments disabled", () => {
  const configured = {
    NODE_ENV: "test" as const,
    PATH: process.env.PATH,
    TRIPCOOKER_RELEASE_TARGET: "production",
    TRIPCOOKER_FREE_LAUNCH: "true",
    PAYMENTS_ENABLED: "false",
    NEXT_PUBLIC_APP_MODE: "live",
    NEXT_PUBLIC_SUPABASE_URL: "https://qa.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "not-a-real-key",
    SUPABASE_SERVICE_ROLE_KEY: "not-a-real-key",
    APP_URL: "https://tripcooker.com",
    NEXT_PUBLIC_SUPPORT_EMAIL: "support@example.com",
    NEXT_PUBLIC_APPROVED_POLICY_VERSION: policyVersion,
  };
  const check = (overrides: Record<string, string>) => spawnSync(process.execPath, ["scripts/prebuild.mjs"], {
    env: { ...configured, ...overrides }, encoding: "utf8",
  });
  assert.equal(check({}).status, 0);
  assert.equal(check({ PAYMENTS_ENABLED: "true" }).status, 1);
  assert.equal(check({ NEXT_PUBLIC_APP_MODE: "demo" }).status, 1);
  assert.equal(check({ NEXT_PUBLIC_APPROVED_POLICY_VERSION: "" }).status, 1);
  assert.equal(check({ SUPABASE_SERVICE_ROLE_KEY: "" }).status, 1);
  assert.equal(check({ NEXT_PUBLIC_SUPPORT_EMAIL: "" }).status, 1);
});
