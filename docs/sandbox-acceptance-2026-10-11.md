# TripCooker sandbox acceptance — October 11, 2026

The deployed website runs launch commit `081a0ab` on Railway. HTTPS public routes respond with 200, `www` redirects to the canonical root with 308 while preserving path/query, and the preview remains excluded from indexing. Nine account/API checks passed through the hosted origin using disposable accounts: authentication required, verified identity and plan enforced, account isolation, stale-write rejection, Free trip limit, archived history, saved-state reload, private database grants and malformed-state rejection. Those fixtures were removed.

The owner confirmed email-code delivery and login, then confirmed the same saved trip appeared on the public website. A direct service-role read independently verified the owner's confirmed email and saved cloud trip. This is passwordless account creation/sign-in, not a separate account per code.

## Actual Stripe sandbox tests

Environment: the dedicated **TripCooker QA** Stripe sandbox. Its account ID and test-key prefix were checked before every test setup and teardown. Checkout and portal browser pages displayed **Sandbox**. The test app was bound to `127.0.0.1:3105`, using the same release build and the real dedicated Supabase database. Every test user/customer was explicitly marked disposable and associated with this test run.

- Monthly hosted Checkout completed with a paid USD 799-cent invoice and an active subscription; annual hosted Checkout completed with a paid USD 5900-cent invoice and an active subscription. The account API returned `premium` for both.
- A simulated declined card showed Stripe's decline message and retained Free access.
- Repeating checkout before payment reused the existing session. Trying another purchase after payment returned 409, preventing a second owned subscription.
- Both Pro accounts saved two active trips through the real account API.
- Actual Checkout completion, invoice-paid and subscription-created events were forwarded by the authorized Stripe CLI listener. The application verified the genuine signatures, responded with 200, and saved minimal receipts in Supabase.
- Both authenticated app portal endpoints opened the dedicated non-default portal. Browser cancellation scheduled each subscription to end at its paid period boundary. Stripe represented this as `cancel_at` equal to the subscription item's period end; `cancel_at_period_end` was false. The test asserts the actual end-time semantics rather than requiring that one boolean representation.
- Pro access and two existing trips remained available immediately after cancellation.
- Stripe test clocks advanced through each paid period end. Both subscriptions became canceled, the account API returned Free, and both saved trips remained accessible and editable. A new additional active trip returned 403.
- Replaying the old signed subscription-created event after cancellation returned 200 without restoring Pro. The original receipt remained a single row; the account API re-read current Stripe state.
- An unsigned notification sent to the configured local test endpoint returned 400.

Both test clocks and their customers were removed, and both disposable auth users and their planner/billing/receipt rows were removed. The owner's real account and saved trip were verified intact. The local billing test server and webhook listener were stopped after testing.

## Scope and remaining release checks

These results prove actual sandbox Checkout, portal cancellation and account access against real Supabase. They do **not** prove production-domain Stripe webhook delivery or live payments. Public Railway checkout remains disabled and its Stripe webhook endpoint is not configured yet. No real money moved, no live subscriptions were created, and main was not merged.

Hosted live payment configuration, signed production webhook delivery, final operator policies/support handling, verified hosted recovery and independent recovery copies, and Stripe's active-website follow-up remain release tasks. Refund handling, failed-renewal recovery and 3DS were not exercised in this sandbox run. Tax collection/registrations remain a separate owner review.

Evidence screenshots and a sanitized JSON report are stored outside Git in the private launch artifact directory. API credentials, browser sessions, passwords and raw payment events were not added to the repository.

[Stripe Billing testing](https://docs.stripe.com/billing/testing) · [Test clocks](https://docs.stripe.com/billing/testing/test-clocks) · [Test resource cleanup](https://docs.stripe.com/billing/testing/bestpractices)
