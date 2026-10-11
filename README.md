# TripCooker 🍳✈️

**Cook one trip free. Build your travel year with Premium.**

TripCooker is a travel planning app that interviews you first,
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
  No external model or AI concierge is part of the supported launch offer.

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

## Live accounts and billing

The launch branch supports an explicit `NEXT_PUBLIC_APP_MODE=live`:

- Supabase email-code sign-in with verified server authentication.
- Private account snapshots, versioned saves, conflict reporting and export.
- Server-enforced one-active-trip free limit.
- Stripe Checkout and billing portal; the server reads current Stripe subscription status.
- Monthly $7.99 and yearly $59 configured price validation.
- Completed trips/archive and calendar totals by departure year.

The default is a labeled browser demo with no payments. Never deploy that as the paid product.
Apply `supabase/launch.sql` to a new project, configure `.env.example`, and follow
[launch setup and acceptance](docs/launch-readiness.md). Do not use `schema.sql` as
production security; it is a reference for the earlier demo and lacks RLS.

```bash
npm ci
npm test
npm run lint
npm run build
npm run check:launch
```

Local checks and simulated provider responses do not prove a live purchase or cross-device account saving.
Vercel production builds reject missing live configuration; preview/local builds allow the demo.
