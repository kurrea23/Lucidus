# TripCooker launch preparation — 2026-10-11

Work is isolated on `codex/tripcooker-launch`. The restored main checkout and the saved Library experiment are unchanged. This is a prepared implementation, not a production release record.

## Supported launch offer

- Free: one active trip, travel interview and Travel DNA, trip dashboard, estimated budget, editable itinerary, packing/tasks, and Festival Mode.
- Pro: multiple active trips, calendar by departure year, annual estimated budget totals, multi-trip dashboard. $7.99/month or $59/year (38% below 12 monthly payments), pending owner confirmation.
- Completed trips and archive are accessible on Free too, so one active trip can be replaced without deleting history. They are also included in Pro, not a Pro-exclusive benefit.
- Template planning, not an external AI concierge. No actual bookings, live prices, event schedule feed, group collaboration, split-cost settlement, or scheduled reminders.

## Configuration and deployment

1. Select the owner's Supabase, Stripe and Vercel accounts and production domain. These services were discovered but are not connected in this chat. No project, prices, or deployment has been created remotely.
2. Use a **new Supabase project**. Apply `supabase/launch.sql`, not legacy `schema.sql`. The launch tables have RLS enabled and no anon/authenticated browser access. Only the server service role can read/write them. Keep that key secret.
3. Enable Supabase email authentication and real SMTP delivery. Configure the sign-in email template to show `{{ .Token }}`; the UI verifies the emailed code with `verifyOtp` (`type: email`). Configure the production site origin, provider rate limits and email abuse protections. Verify a real email arrives. Sign-in is passwordless; no password reset is needed.
4. Copy `.env.example` to an ignored `.env.local` for local integration testing. Set equivalent variables in hosting. Public Supabase URL/anon key and app mode are build-time settings; changes require rebuilding. The service role and Stripe secret are server-only.
5. Create Stripe recurring USD prices: 799 cents/month and 5900 cents/year, quantity 1. No trial. Set the two price IDs. The server validates price, currency and interval before creating Checkout. Use test-mode prices/keys first, then matching live-mode values.
6. Enable the Stripe billing portal. Allow cancellation at period end and payment-method updates. Avoid pausing subscriptions and changing to unrelated products. Enable Stripe's one-subscription-per-customer restriction. Checkout uses the verified user's server-stored customer, reuses open sessions, serializes creation in Postgres and uses Stripe idempotency. An abandoned checkout can be replaced when choosing another interval.
7. `APP_URL` must be the canonical HTTPS origin, with no request-supplied return URL. Put secret values into provider dashboards; never paste them into chat. Set `PAYMENTS_ENABLED=false` during setup. Auth and free-trip testing still work.
8. Owner must supply business identity, support email, cancellation/refund terms and privacy/data-retention policy. Publish reviewed policies and support links before taking money. This branch does not invent an operator or a refund policy. Define support handling for account deletion, cancellation/refunds and backup recovery.
9. Configure Supabase database backups and confirm a restore, Vercel error monitoring, and provider usage/abuse limits. Trip data and emergency details are private. The export is JSON; there is no import/restore UI yet. Demo data is never silently imported into an account.
10. Deploy a Vercel preview with live app mode, using Stripe test mode. Enable payments in the preview only with Stripe test-mode credentials, then run the acceptance list below. After approval of the real configuration and policies, enable payments and use `npm run check:launch` for presence checks. Production builds also run this check. A successful config check does not prove live service operation.
11. Deploy the exact tested commit to production. Verify the real domain, email, purchase, access and cancellation. Keep promotion drafts unpublished until the destination and launch URL are verified.

## Persistence and billing design

Account API verifies the bearer token with Supabase `getUser`; it does not accept client identity or Premium grants. Reads/writes are scoped by that verified ID. Account snapshots are schema/size checked. A private Postgres counter caps verified-user API requests at 180 per minute; provider auth/edge limits still need configuration. A row-locked RPC rejects stale versions and extra/reactivated free trips. Downgraded subscribers retain existing trips and can edit them; they cannot add active trips above the limit.

The client serializes saves and retains failed edits. A visible banner offers retry/export and explicit reload for conflicts. Pending edits are kept in sessionStorage under an account-specific key; this is recovery within the current browser session, not offline-first cloud sync. Refreshing from account is explicit. It is not live multi-user collaboration.

Subscription status is read directly from Stripe on account reads/writes. There is no webhook-driven entitlement cache. Thus canceled/past-due/incomplete subscriptions do not receive stale paid access, and out-of-order webhooks cannot grant it. A Stripe outage causes saving/loading for billing-linked customers to fail visibly rather than silently treating them as Free or overwriting data. This design has additional Stripe API latency/usage; monitor it before scaling. Purchase redirect alone never upgrades an account.

## Acceptance and evidence

Local automated tests execute the PostgreSQL migration using PGlite and the API handlers with simulated Supabase/Stripe responses. These are local evidence, not Supabase-hosted, SMTP, hosted Stripe, or production-domain proof.

Browser walkthrough uses an isolated local demo origin, separate from the user's existing trip data. Tested: landing, normal/festival interview, missing destination, reversed dates, negative budgets, plan creation, notes and festival save, budget edit/add and warnings, packing toggles/add, task completion/add/due date, itinerary add/edit, reload persistence, free gate, demo Pro unlock, calendar year totals and archive/history. A trip deletion confirmation interrupted browser control; it was not accepted. Cascade deletion is covered by automated tests. Reset/export and live account/billing checks are tracked separately. An automated live-store test verifies that unsaved profile edits survive recovery and cannot change the verified identity or plan.

Required real-service checks before release:

- Email signup/sign-in/sign-out and code expiration/invalid codes.
- Account A vs B isolation, direct API tampering, and two-device persistence.
- Concurrent-device conflict, failed/offline save, export and explicit reload.
- Free second-trip gate and free archive/complete/reactivation limit.
- Monthly/yearly test purchase; declining card, canceled checkout and repeated clicks.
- Checkout configured price/currency matches exactly; unsupported price rejects.
- Current active subscription grants Pro after account refresh; redirect/query/local storage cannot grant it.
- Billing portal ownership, cancellation, failed renewal/past-due state and preserved trip access.
- Stripe/database interruption, hosted request-size limit, database backup/restore and support flow.
- Mobile/desktop layout, all public routes and a human review of policies/support.
- Production HTTPS domain and a verified live transaction/cancellation. Record proof without card data or secrets.

## Current verification result

- 12 automated tests pass (10 core/database/store tests and 2 API/billing tests).
- ESLint and Next.js production build pass.
- `npm audit --omit=dev` reports zero vulnerabilities. Full audit retains five development-only ESLint dependency advisories.
- Local live-mode API rejects unauthenticated state access with 401 and disabled checkout with 503.
- Browser live-mode onboarding correctly shows accounts unavailable when configuration is absent; pricing has no demo Premium switch.
- `npm run check:launch` and Vercel production prebuild correctly fail because provider configuration is missing and payments are disabled.
- No cloud deployment, real email, real transaction, or promotion post has been performed.

## Dependencies

Next.js upgraded from 16.2.9 to 16.4.0 after audit reported a critical advisory. Runtime audit is clean. Remaining advisory reports involve five packages in the development-only ESLint glob dependency chain; npm's proposed force fix downgrades Next's lint configuration to 14.x. That incompatible downgrade was not applied. Do not run lint against untrusted glob patterns; reassess patched releases before release.

Provider references: [Supabase verified user](https://supabase.com/docs/reference/javascript/auth-getuser), [Supabase email code](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Stripe hosted subscriptions](https://docs.stripe.com/payments/checkout/build-subscriptions.md?payment-ui=stripe-hosted), [Stripe customer portal](https://docs.stripe.com/customer-management), [Stripe subscription limits](https://docs.stripe.com/payments/checkout/limit-subscriptions).
