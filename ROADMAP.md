# Festiplanner — Product Roadmap

**What it is:** a trip-planning app branded for festivals. It covers everything between
"we bought tickets" and "we're home" — crew, tickets, travel, lodging, money, gear,
and the trip itinerary. It is NOT a set-schedule/lineup app; a small "don't-miss list"
is the only artist-related feature.

PWA-first, wrapped for the iOS App Store later. Real backend for accounts, sync and
friend invites. Premium = multiple festival trips + crew collaboration.

---

## The trip model

Every festival is a **Trip** that moves through phases. The app's job is to always
answer: *"what do we still need to sort out?"*

1. **Lock it in** — festival, dates, crew RSVPs (in/maybe/out), ticket tracker per
   person (needed → bought → in hand)
2. **Getting there** — travel mode, departure/return times, car assignments & rides,
   flight info
3. **Staying** — camping/hotel/Airbnb details, check-in/out, confirmation numbers,
   campsite pin
4. **Money** — big three upfront (ticket/travel/stay), shared expenses, who-owes-who
   settle-up
5. **Gear & packing** — personal list + shared gear with owners ("who's bringing the
   tent")
6. **Trip itinerary** — day-by-day logistics blocks: set off, grocery stop, check-in,
   gates open, pack down
7. **Info hub** — ticket photos, confirmations, venue address, rules, meetup point,
   ICE contacts; fully offline

**Home = trip readiness score** ("7 of 9 sorted") + countdown + the next milestone,
not artist sets.

---

## Phase 1 — Trip-first core ✅ (this build)

- Trip readiness score with next-milestone nudge on Home
- Ticket tracker per crew member with price + status
- Travel plan (mode, depart/return, rides) and Stay (type, address, check-in/out, conf#)
- Trip itinerary: day strip spanning departure → return, logistics stops, starter template
- Shared expenses: payer + even split across crew, settle-up balances
- Shared gear: packing items flagged shared with an assigned owner
- Info hub: venue address, meetup point, rules, ICE contact
- Don't-miss list (minor module): a handful of acts you refuse to miss
- Premium unchanged: free = one trip solo; Pro = multiple trips + crew invites

## Phase 2 — Useful depth (still no backend)

- Service worker: full offline (no signal at the gate — info hub must always open)
- Photo attachments in the info hub (ticket QR, confirmation screenshots) via IndexedDB
- Weather forecast for trip dates (Open-Meteo) feeding packing suggestions
- Settle-up improvements: per-expense custom splits, "mark settled"
- Reminders: set-off time, check-in/out, don't-miss acts (Web Notifications)
- Undo for deletes, swipe gestures, app icons, Lighthouse PWA 100

## Phase 3 — Real backend (Supabase)

- Sign in with Apple / Google / magic link; local data migrates into the account
- Offline-first sync with conflict resolution
- Schema: `profiles`, `trips`, `trip_members` (rsvp + role), `tickets`, `travel_legs`,
  `rides`, `stays`, `itinerary_items`, `packing_items`, `expenses`, `expense_splits`,
  `friendships`, `invites`
- Real invite links: `/join/FP-XXXX` deep link joins the trip
- Live crew collaboration: RSVPs, ticket statuses, gear claims, expense feed all sync
- Push: "Maya marked the tent covered", "set-off in 2 hours", "Jake paid $80 gas"

## Phase 4 — Premium & payments

- Entitlements server-side; free = 1 trip solo, Pro = unlimited trips + crew
- Stripe Checkout on web ($4.99/mo, $29.99/yr); 7-day trial triggered by first invite
- Polished PDF trip report (replaces .txt export)

## Phase 5 — App Store

- Capacitor wrap: native haptics, share sheet, push, biometric lock
- StoreKit IAP replacing Stripe inside the iOS build
- ASO: "festival trip planner", "festival packing list", "group trip planner"

## Phase 6 — Growth

- Festival database: pick your festival → dates, venue address, rules pre-filled
- Trip recap: total spent, miles traveled, photos, "trip #4 with Maya"
- Templates marketplace: share packing/itinerary templates per festival
- Privacy-friendly analytics, i18n groundwork

---

## Suggested build order

| Sprint | Scope |
|---|---|
| 1 | ✅ Trip-first rebuild (this PR) |
| 2 | Offline service worker, info-hub photos, weather, reminders, polish |
| 3 | Supabase auth + schema + sync |
| 4 | Real invites + live crew collaboration |
| 5 | Stripe + entitlements, PDF reports |
| 6 | Capacitor + App Store submission |
