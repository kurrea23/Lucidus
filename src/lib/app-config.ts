// Public switches only. Secrets belong in src/lib/server and server environment variables.
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
