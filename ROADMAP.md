# Festiplanner — Product Roadmap

Goal: take the working prototype to a genuinely useful, optimized festival-planning
product. PWA-first, wrapped for the iOS App Store later. Real backend for accounts,
sync, and friend invites. Premium = unlimited festivals + crew features.

---

## Phase 0 — Prototype ✅ (done)

Dark-card design system, onboarding, festival CRUD with live countdown, schedule
builder with clash detection, packing list with progress, budget tracker, demo
paywall, simulated friends, light/dark themes, GitHub Pages deploy.

---

## Phase 1 — Make it genuinely useful (no backend needed)

The features that make someone open the app every day of festival week.

**Schedule, leveled up**
- Visual timeline view: stages as columns, sets as blocks, overlaps visibly collide
- "Live mode" during the festival: now playing / up next pinned to Home, auto-scrolling today
- Bulk lineup entry: paste a lineup ("9:00 Artist - Stage" lines) and parse it into sets
- Edit sets in place (currently add/delete only)
- Set reminders via Web Notifications (15 min warning, configurable)

**Trip logistics**
- Weather forecast for festival dates/location (Open-Meteo, free, no key) on Home
  and as packing suggestions ("rain expected — poncho added?")
- Important info card: ticket/wristband photos, campsite spot, parking lot, locker number
- Getting-there checklist: set-off time, ride share splits

**Budget, leveled up**
- Cost splitting: mark expenses as shared, see per-person share and who-owes-who settle-up
- Pre-festival vs on-site spending split; daily spend during live mode

**Quality & optimization**
- Service worker: full offline support (festival grounds have no signal — this is critical)
- Proper app icons + splash screens, Lighthouse PWA score 100
- Undo for deletes (toast with Undo button) instead of confirm sheets everywhere
- Swipe gestures on rows (complete / delete), pull-to-refresh
- Empty/loading/error states audit; accessibility pass (focus traps in sheets, ARIA)

## Phase 2 — Real backend (Supabase)

Accounts, sync, and real friends. Supabase free tier: Postgres + Auth + Realtime + Row
Level Security, works straight from a static PWA.

**Auth & sync**
- Sign in with Apple / Google / magic link; anonymous-to-account upgrade path
  (local data migrates into the account on first sign-in)
- Offline-first: localStorage stays the source of truth on-device, background sync
  with conflict resolution (last-write-wins per field, tombstones for deletes)

**Schema**
`profiles`, `festivals`, `festival_members` (role: owner/member), `sets`,
`set_rsvps` (who's going to which set), `packing_items` (assignee), `expenses`
(payer + split members), `friendships`, `invites` (code, expiry)

**Real crew features (the premium core)**
- Invite links that actually work: `https://<domain>/join/FP-XXXX` deep link → joins crew
- Shared festival: crew members see the same lineup, RSVP independently
- "Who's going where": friend avatars on each set, clash view across the crew
- Shared packing list with assignments and live check-off
- Shared expenses with real settle-up across accounts
- Crew chat-lite: pinned notes / meet-up point per festival ("left of soundboard 21:00")

**Push**
- Web Push: set reminders, "X joined your crew", "Y RSVP'd to the same set"

## Phase 3 — Premium & payments

- Entitlements live in the backend (not a local flag)
- Free: 1 festival, solo. Pro: unlimited festivals, crew features, exports
- Web: Stripe Checkout + customer portal ($4.99/mo, $29.99/yr)
- 7-day Pro trial on first crew invite (the hook moment)
- Polished PDF trip report export (replaces .txt)

## Phase 4 — App Store

- Wrap with Capacitor: native haptics, share sheet, push, biometric lock
- StoreKit in-app purchase replacing Stripe inside the iOS build
- App Store assets: screenshots, preview video, ASO keywords
  ("festival planner", "festival schedule", "rave planner")

## Phase 5 — Growth & polish

- Festival lineup database integration (community-submitted lineups; explore
  public APIs/partnerships) so users pick their festival and the lineup is pre-loaded
- Memories: photo journal per festival day, year-in-review recap
- Friend profiles, festival history, "festivals together" stats
- Privacy-friendly analytics (Plausible) to tune onboarding funnel
- i18n groundwork (EU festival market is huge)

---

## Suggested build order

| Sprint | Scope |
|---|---|
| 1 | Offline service worker, icons, timeline view, set editing, bulk lineup paste |
| 2 | Weather, live mode, notifications, info card, undo/swipe polish |
| 3 | Supabase auth + schema + sync |
| 4 | Real invites, shared crew schedule, shared packing/expenses |
| 5 | Stripe + entitlements, PDF reports |
| 6 | Capacitor + App Store submission |
