# TripCooker 🍳✈️

**Cook one trip free. Build your travel year with Premium.**

TripCooker is an AI-powered travel planning app that interviews you first,
learns your travel style, and "cooks" a personalized trip plan — dashboard,
itinerary, budget, packing checklist, and travel tasks. Festival Mode swaps in
everything an event trip actually needs (wristbands, hydration packs, meetup
spots, recovery days).

## Core loop

Interview → Travel DNA → One Trip Dashboard → Checklist → Budget → Itinerary →
Premium gate for multiple trips.

## Features (MVP)

- **Travel interview** — multi-step onboarding that learns trip type, vibe,
  pace, budget, lodging/transport/food style, and stress points.
- **Travel DNA** — a generated traveler profile shown as a card.
- **Trip dashboard** — countdown, readiness score (0–100 "cooked" meter),
  next-step card, budget snapshot, itinerary/packing/task previews, notes.
- **Itinerary builder** — day-by-day items with add/edit/delete and a
  tight-timing warning when items are less than 30 minutes apart.
- **Budget builder** — category cards, estimated vs paid, daily spend
  estimate, over-budget warning.
- **Packing checklist** — grouped by category with percent packed.
- **Travel tasks** — priorities, due dates, overdue flags.
- **Festival Mode** — festival packing/tasks, ticket status, venue
  transportation, meetup spot, afterparty and recovery planning.
- **Premium gate** — free users get one active trip; creating a second shows
  the Travel Season Pro upsell.
- **Travel Year Calendar** — locked preview for free users; month-by-month
  trips, annual cost, and per-trip readiness for premium users.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS v4 + shadcn-style components + lucide-react icons
- **Local demo mode**: all data persists in `localStorage`
  (`src/lib/store.ts`), shaped to mirror the Supabase schema in
  [`supabase/schema.sql`](supabase/schema.sql) so real auth + Postgres can be
  swapped in without UI changes.
- `aiTripPlanner()` (`src/lib/ai-trip-planner.ts`) returns structured JSON
  from the interview answers. The MVP uses a deterministic template planner;
  it is the seam where a real model call goes when an API key is configured.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit **Start Cooking a
Trip** (or **View Demo** to seed a sample EDC Las Vegas festival trip).

## Project map

| Path | What it is |
| --- | --- |
| `/` | Landing page |
| `/onboarding` | Travel interview |
| `/dashboard` | Main dashboard |
| `/trips/new` | New trip (premium gate for second trip on free plan) |
| `/trips/[tripId]` | Trip dashboard |
| `/trips/[tripId]/itinerary` · `/budget` · `/packing` · `/tasks` | Trip detail views |
| `/calendar` | Travel Year Calendar (premium) |
| `/premium` | Pricing + demo upgrade |
| `/settings` | Profile, plan, Travel DNA, data reset |

## Deploying

Deploy to [Vercel](https://vercel.com) — no environment variables required for
demo mode.

## Cloud mode: real accounts + payments

The app runs in **local demo mode** by default (trips save per-browser, the
Premium button is a demo). Adding environment variables switches on real
functionality — no code changes needed:

### 1. Accounts + synced trips (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, paste and run all of [`supabase/schema.sql`](supabase/schema.sql)
   (tables, row-level security, signup trigger).
3. For easy testing, turn off email confirmation: Authentication → Sign In /
   Providers → Email → disable "Confirm email" (re-enable for production).
4. Set env vars (locally in `.env.local`, on Vercel in Project → Settings →
   Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

With these set, the app shows Sign in / Create account. On first sign-in, any
local demo trips migrate into the account, and every change syncs to Postgres.
`users.plan` is server-controlled — column-level grants stop clients from
giving themselves premium.

### 2. Real payments (Stripe)

1. Create a [Stripe](https://stripe.com) account. In Product catalog, create a
   product ("Travel Season Pro") with two recurring prices: $7.99/month and
   $59/year. Copy both price IDs.
2. Add a webhook endpoint: Developers → Webhooks → Add endpoint →
   `https://YOUR-APP-URL/api/stripe-webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy the signing secret.
3. Set env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`,
   `SUPABASE_SERVICE_ROLE_KEY` (server-only), `NEXT_PUBLIC_APP_URL`.

Signed-in users then get real Stripe checkout on `/premium`; the webhook flips
`users.plan` to `premium` on payment and back to `free` on cancellation. Until
these vars exist, checkout returns 501 and the UI explains payments aren't
switched on — nothing breaks.

See [`.env.example`](.env.example) for the full list.
