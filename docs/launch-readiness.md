# TripCooker launch preparation — 2026-10-11

Work is isolated on `codex/tripcooker-launch`. The restored main checkout and the saved Library experiment are unchanged. This is a prepared implementation, not a production release record.

The owner now prioritizes a revenue-funded MVP with low fixed costs. Follow [the Railway bootstrap plan](bootstrap-launch.md) as the primary hosting path. Vercel remains an alternative. Paid upgrades are recommendations for later needs, not prerequisites that have been purchased.

## Supported launch offer

- Free: one active trip, travel interview and Travel DNA, trip dashboard, estimated budget, editable itinerary, packing/tasks, and Festival Mode.
- Pro: multiple active trips, calendar by departure year, annual estimated budget totals, multi-trip dashboard. $7.99/month or $59/year (38% below 12 monthly payments), pending owner confirmation.
- Completed trips and archive are accessible on Free too, so one active trip can be replaced without deleting history. They are also included in Pro, not a Pro-exclusive benefit.
- Template planning, not an external AI concierge. No actual bookings, live prices, event schedule feed, group collaboration, split-cost settlement, or scheduled reminders.

## Configuration and deployment

1. Select the owner's Supabase, Stripe and Railway accounts (Vercel is an alternative host). The owner purchased and selected `tripcooker.com`; root and `www` DNS are now configured and Railway verifies valid HTTPS certificates. No app is deployed and mail routing remains pending. The connectors are connected; see the verified provider setup below. Connection alone does not configure the app or prove deployment permissions.
2. Use a **new Supabase project**. Apply `supabase/launch.sql`, not legacy `schema.sql`. The launch tables have RLS enabled and no anon/authenticated browser access. Only the server service role can read/write them. Keep that key secret.
3. Enable Supabase email authentication and real SMTP delivery. Configure the sign-in email template to show `{{ .Token }}`; the UI verifies the emailed code with `verifyOtp` (`type: email`). Configure the production site origin, provider rate limits and email abuse protections. Verify a real email arrives. Sign-in is passwordless; no password reset is needed.
4. Copy `.env.example` to an ignored `.env.local` for local integration testing. Set equivalent variables in hosting. Public Supabase URL/anon key and app mode are build-time settings; changes require rebuilding. The service role and Stripe secret are server-only.
5. Create Stripe recurring USD prices: 799 cents/month and 5900 cents/year, quantity 1. No trial. Set the two price IDs. The server validates price, currency and interval before creating Checkout. Use test-mode prices/keys first, then matching live-mode values.
6. Enable the Stripe billing portal. Allow cancellation at period end and payment-method updates. Avoid pausing subscriptions and changing to unrelated products. Enable Stripe's one-subscription-per-customer restriction. Checkout uses the verified user's server-stored customer, reuses open sessions, serializes creation in Postgres and uses Stripe idempotency. An abandoned checkout can be replaced when choosing another interval.
7. `APP_URL` must be the canonical HTTPS origin, with no request-supplied return URL. Put secret values into provider dashboards; never paste them into chat. Set `PAYMENTS_ENABLED=false` during setup. Auth and free-trip testing still work.
8. Owner confirmed the public operator name **Lucidum L.C.**. Support email, cancellation/refund terms and privacy/data-retention policy still need setup and review. Publish reviewed policies and support links before taking money. Define support handling for account deletion, cancellation/refunds and backup recovery.
9. Configure Supabase database backups and confirm a restore, Vercel error monitoring, and provider usage/abuse limits. Trip data and emergency details are private. The export is JSON; there is no import/restore UI yet. Demo data is never silently imported into an account.
10. Deploy Railway staging (or a Vercel preview) with live app mode, using Stripe test mode. Enable payments in staging only with Stripe test-mode credentials, then run the acceptance list below. After approval of the real configuration and policies, enable payments and use `npm run check:launch` for presence checks. Production builds also run this check. A successful config check does not prove live service operation.
11. Deploy the exact tested commit to production. Verify the real domain, email, purchase, access and cancellation. Keep promotion drafts unpublished until the destination and launch URL are verified.

## Persistence and billing design

Account API verifies the bearer token with Supabase `getUser`; it does not accept client identity or Premium grants. Reads/writes are scoped by that verified ID. Account snapshots are schema/size checked. A private Postgres counter caps verified-user API requests at 180 per minute; provider auth/edge limits still need configuration. A row-locked RPC rejects stale versions and extra/reactivated free trips. Downgraded subscribers retain existing trips and can edit them; they cannot add active trips above the limit.

The client serializes saves and retains failed edits. A visible banner offers retry/export and explicit reload for conflicts. Pending edits are kept in sessionStorage under an account-specific key; this is recovery within the current browser session, not offline-first cloud sync. Refreshing from account is explicit. It is not live multi-user collaboration.

Subscription status is read directly from Stripe on account reads/writes. Pro requires an active subscription with a configured price, quantity 1 and a paid latest invoice; delayed payment methods cannot grant access solely from active status. There is no webhook-driven entitlement cache. Canceled/past-due/incomplete subscriptions do not receive stale paid access, and out-of-order webhooks cannot grant it. A Stripe outage causes saving/loading for billing-linked customers to fail visibly rather than silently treating them as Free or overwriting data. This design has additional Stripe API latency/usage; monitor it before scaling. Purchase redirect alone never upgrades an account.

Register `https://tripcooker.com/api/billing/webhook` in the selected live Stripe account and the actual staging origin's corresponding endpoint in its sandbox. Store each endpoint's own `STRIPE_WEBHOOK_SECRET` privately on its host. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` and `invoice.payment_failed`. The handler verifies signatures against the untouched body, checks test/live mode, looks up the customer through the server-owned mapping, re-reads current paid subscription state and stores a minimal deduplicated receipt. It never saves raw event bodies or contact/card details. Receipts are audit evidence, not access grants. Failed writes return a non-2xx response for Stripe retries. Processing is synchronous for this MVP; monitor delivery latency and introduce a durable queue before volume requires one. No webhook endpoint has been registered remotely yet. [Stripe webhook guidance](https://docs.stripe.com/webhooks)

New live Checkout links require both `charges_enabled` and `payouts_enabled` on the application's own Stripe account, checked at request time. The billing status route uses the same check. Unknown key formats, missing account-read permissions and Stripe errors keep checkout closed. Sandbox keys can exercise test payments without real payouts. Billing portal access remains available so an existing customer can manage or cancel. This gate does not revoke previously issued Stripe-hosted links or stop existing recurring renewals; no live TripCooker sessions or subscriptions have been created here.

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
- Current active subscription with a paid latest invoice grants Pro after account refresh; redirect/query/local storage cannot grant it. Pending asynchronous payments remain Free.
- Hosted webhook delivery, duplicate retry, canceled subscription followed by an old active event, and payment failure must leave the correct current access. Verify signature rejection and durable receipts without printing secrets or raw payloads.
- Billing portal ownership, cancellation, failed renewal/past-due state and preserved trip access.
- Stripe/database interruption, hosted request-size limit, database backup/restore and support flow.
- Mobile/desktop layout, all public routes and a human review of policies/support.
- Production HTTPS domain and a verified live transaction/cancellation. Record proof without card data or secrets.

## Current verification result

- 18 automated tests pass (10 core/database/store, 2 production-build guard, 4 API/billing tests and 2 signed webhook tests), including paused payouts, disabled charges, missing account-read permission, restored eligibility and continued billing management.
- Local production-server checks confirm `www` redirects with HTTP 308 to the root HTTPS origin while retaining path/query values; root and unrelated Host values do not redirect. Public hosted redirect behavior remains unverified until deployment.
- ESLint and Next.js production build pass.
- `npm audit --omit=dev` reports zero vulnerabilities. Full audit retains five development-only ESLint dependency advisories.
- Local live-mode API rejects unauthenticated state access with 401 and disabled checkout with 503.
- Browser live-mode onboarding correctly shows accounts unavailable when configuration is absent; pricing has no demo Premium switch.
- `npm run check:launch` and Vercel production prebuild correctly fail because provider configuration is missing and payments are disabled.
- No cloud deployment, real email, real transaction, or promotion post has been performed.

## Dependencies

Next.js upgraded from 16.2.9 to 16.4.0 after audit reported a critical advisory. Runtime audit is clean. Remaining advisory reports involve five packages in the development-only ESLint glob dependency chain; npm's proposed force fix downgrades Next's lint configuration to 14.x. That incompatible downgrade was not applied. Do not run lint against untrusted glob patterns; reassess patched releases before release.

## Verified provider setup — 2026-10-11

- Supabase: connected organization `kurrea23's Org` is on Free and has no projects. Recommended: a dedicated `tripcooker` project in this organization, initially Free for integration testing. The connector's `get_cost` operation is unavailable; automated project creation requires a cost-confirmation ID, so create/review the project in the dashboard instead. Do not fabricate a confirmation ID. A paid launch needs a verified backup/recovery plan. Supabase Pro starts at $25/month; Free has no automatic backups and pauses after a week of inactivity. [Pricing](https://supabase.com/pricing)
- Stripe: the owner confirmed the account named `Instagram` belongs to their company and confirmed **Lucidum L.C.** as the public operator name. The current-account retrieval operation was subsequently found. A fresh read shows charges enabled, payouts disabled, no currently due/past-due fields and three pending business-model review items. Submitting the form has not restored payouts. No live billing settings or charges were changed. Use an isolated sandbox for hosted payment acceptance tests, and finish customer-facing branding and policies. [Sandboxes](https://docs.stripe.com/sandboxes)
  - The official Stripe CLI supports a temporary sandbox through `stripe sandbox create`. Its noninteractive attempt stopped because an owner email is required. No email was inferred from Git or sent, no sandbox was created, and no key was generated. Owner email is requested before retrying. CLI configuration and captured output are outside the repository in a private directory; never add them to Git.
- Vercel: existing Next.js project `tripcooker`, Node 24.x, has no deployments or domains. Project reads succeed, but team-settings access for `lucidus-projects` returns 403; its billing plan and deployment authorization remain unverified. There is no locally installed Vercel CLI with independent authorization to use as fallback. Reconnect the appropriate scope before deployment. Hobby is noncommercial only; Pro currently starts at $20/month with one deploying seat, plus applicable usage/taxes. [Hobby rules](https://vercel.com/docs/plans/hobby), [Pro pricing](https://vercel.com/docs/plans/pro-plan)
  - Subsequent official CLI fallback completed authentication and read the team: Hobby, active, owner access. This resolves the plan uncertainty through independent CLI credentials; the connector's team-settings endpoint still returns 403. The project environment-variable inventory is empty. For this owner's cost priority, Railway is the preferred host; no Vercel upgrade or deployment was made.
- Railway: connected workspace `kurrea23's Projects` originally contained only `awardsignal`. The separate private `tripcooker` project's prepared `tripcooker-web` service is now applied in `staging`, with seven non-secret variables and build/start/healthcheck/sleep/resource configuration. Earlier “not approved” tool results did not prove a deliberate user rejection: the owner reported no mobile popup. The latest retry succeeded with `nothing_staged`. Root and `www` custom domains have four saved Cloudflare records; Railway reports verified ownership, propagated DNS and valid HTTPS certificates. The service still has no source, deployment, runtime, database, volume or bucket. See [bootstrap plan](bootstrap-launch.md).
- Production email: configure a real SMTP sender and the email-code template. Supabase's default sender only delivers to authorized organization team addresses and is not a public production email service. [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)

The owner purchased `tripcooker.com` and explicitly selected it for this launch. No provider subscription, plan upgrade or production deployment has been performed here. Published prices are guidance, not an account-specific cost confirmation. Secret credentials belong in ignored local files or provider secret settings, never this document.

Provider references: [Supabase verified user](https://supabase.com/docs/reference/javascript/auth-getuser), [Supabase email code](https://supabase.com/docs/reference/javascript/auth-signinwithotp), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Stripe hosted subscriptions](https://docs.stripe.com/payments/checkout/build-subscriptions.md?payment-ui=stripe-hosted), [Stripe customer portal](https://docs.stripe.com/customer-management), [Stripe subscription limits](https://docs.stripe.com/payments/checkout/limit-subscriptions).
