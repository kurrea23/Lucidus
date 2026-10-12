// Public switches only. Secrets belong in src/lib/server and server environment variables.
import policyRelease from "./policy-release.json";
export const POLICY_RELEASE = policyRelease;
export function approvedPolicies(
  version = process.env.NEXT_PUBLIC_APPROVED_POLICY_VERSION,
  email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
) {
  return version === POLICY_RELEASE.version &&
    /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email ?? "");
}
export const POLICIES_APPROVED = approvedPolicies();
export const SUPPORT_EMAIL = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
) ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL! : "";
export const LIVE_MODE = process.env.NEXT_PUBLIC_APP_MODE === "live";
export const AUTH_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
export const FREE_FEATURES = [
  "1 active trip",
  "Travel interview & Travel DNA",
  "Trip dashboard & readiness score",
  "Budget & itinerary",
  "Packing list & travel tasks",
  "Festival Mode",
];
export const PRO_FEATURES = [
  "Multiple active trips",
  "Travel Year Calendar",
  "Budget totals by year",
  "Multi-trip dashboard",
  "Completed trips & archive",
];
export const PRICING = {
  monthly: { cents: 799, interval: "month" },
  yearly: { cents: 5900, interval: "year" },
} as const;
