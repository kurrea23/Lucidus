const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_YEARLY_PRICE_ID",
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
if (process.env.PAYMENTS_ENABLED !== "true")
  issues.push(
    "Payments are disabled. Enable only after live acceptance checks.",
  );
if (issues.length) {
  console.error(
    "Launch configuration incomplete (values are never printed):\n" +
      issues.map((s) => "- " + s).join("\n"),
  );
  process.exitCode = 1;
} else
  console.log(
    "Required configuration is present. This does not prove account delivery, payments, policy review, or deployment acceptance.",
  );
