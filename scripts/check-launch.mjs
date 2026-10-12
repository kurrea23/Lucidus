import { readFileSync } from "node:fs";
const policy = JSON.parse(readFileSync(new URL("../src/lib/policy-release.json", import.meta.url), "utf8"));
const freeLaunch = process.env.TRIPCOOKER_FREE_LAUNCH === "true";
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_URL",
  ...(!freeLaunch ? ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_MONTHLY_PRICE_ID", "STRIPE_YEARLY_PRICE_ID", "STRIPE_PORTAL_CONFIGURATION_ID"] : []),
];
const issues = [];
if (process.env.NEXT_PUBLIC_APP_MODE !== "live")
  issues.push("Set NEXT_PUBLIC_APP_MODE=live for production.");
for (const name of required)
  if (!process.env[name]) issues.push(`${name} is missing.`);
try {
  const url = new URL(process.env.APP_URL);
  if (url.protocol !== "https:" || url.hostname.endsWith(".example"))
    issues.push("APP_URL must be the real HTTPS deployment origin.");
} catch {
  issues.push("APP_URL must be a valid deployment origin.");
}
if (freeLaunch && process.env.PAYMENTS_ENABLED !== "false")
  issues.push("Free launch requires PAYMENTS_ENABLED=false.");
if (!freeLaunch && process.env.PAYMENTS_ENABLED !== "true")
  issues.push(
    "Payments are disabled. Enable only after live acceptance checks.",
  );
if (process.env.NEXT_PUBLIC_APPROVED_POLICY_VERSION !== policy.version)
  issues.push("Approve the current policy version before production release.");
if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? ""))
  issues.push("Set NEXT_PUBLIC_SUPPORT_EMAIL to the verified public support address.");
if (!freeLaunch && !/^[sr]k_live_/.test(process.env.STRIPE_SECRET_KEY ?? ""))
  issues.push("Production billing requires a live Stripe key; sandbox keys are for staging.");
if (issues.length) {
  console.error(
    "Launch configuration incomplete (values are never printed):\n" +
      issues.map((s) => "- " + s).join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    (freeLaunch ? "Free launch is configured; new paid checkout stays closed. " : "Required paid configuration is present. ") +
    "This does not prove account delivery, payments, policy review, or deployment acceptance.",
  );
