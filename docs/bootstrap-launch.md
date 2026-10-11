# TripCooker: revenue-first MVP launch

The owner's priority is the lowest reasonable fixed cost, then reinvestment from real subscription revenue. Railway is the proposed host. The Library remains separate.

## Smallest practical stack for this branch

| Component | Role | Initial cost and condition |
| --- | --- | --- |
| Railway Hobby | Run the Next.js website and server APIs | $5/month minimum, including $5 resource usage; additional usage costs extra. Inspect the existing workspace's actual plan before starting compute. |
| Supabase Free | Email authentication and private trip data | $0 within Free quotas. Configure and verify secure database exports and a restore before accepting customer data; Free lacks automatic backups and pauses after inactivity. |
| Resend Free, or existing SMTP | Deliver Supabase sign-in codes | Resend currently includes 3,000 emails/month and 100/day. Needs a verified sending domain. Reuse an owned domain if available. |
| Stripe pay-as-you-go | Hosted subscription checkout and customer portal | Fees on successful payments and Billing volume; no fixed Billing subscription needed. Test in a sandbox first. |
| Domain | Public website address | Start with a Railway-generated URL or a subdomain of an owned domain. A new domain has a separate registration cost. |

These are provider prices, not an account-specific quote or a guarantee that the whole app costs $5. Railway recommends Pro for commercial applications that need higher limits/support. This plan accepts the smaller tier's support and resource tradeoffs; confirm current account terms and measured usage before release.

Sources checked 2026-10-11: [Railway pricing](https://railway.com/pricing), [Railway FAQs](https://docs.railway.com/pricing/faqs), [Supabase pricing](https://supabase.com/pricing), [Resend pricing](https://resend.com/pricing), [Stripe pricing](https://stripe.com/pricing).

## Revenue arithmetic, not a revenue forecast

The current offer is **$7.99 per month**, a recurring subscription, with a $59/year option already implemented. Explain the interval clearly. One active trip remains Free. Sell the working multiple-trip planning tools and calendar; the planner uses editable templates, not a paid AI API.

Using standard US domestic-card pricing of 2.9% + $0.30 and Billing pay-as-you-go of 0.7%, an illustrative monthly payment leaves approximately **$7.40** before hosting, taxes, refunds, disputes, other payment surcharges and business expenses. The real merchant's contract/country and payment method may change this.

| Paying monthly subscribers | Gross monthly receipts | After these illustrative Stripe fees |
| --- | --- | --- |
| 1 | $7.99 | $7.40 |
| 5 | $39.95 | $37.01 |
| 10 | $79.90 | $74.02 |
| 25 | $199.75 | $185.06 |

One successful monthly payment can cover the $5 hosting minimum under these assumptions. It does not establish profitability or cover a larger usage bill. Retain cash for refunds and upgrades. Upgrade when actual load, backup needs or support needs justify it; do not make upgrades depend solely on a subscriber count.

## Railway preparation and launch order

1. A separate private `tripcooker` project now exists in `kurrea23's Projects`, with default environment `staging`. The `tripcooker-web` service and five non-secret configuration variables are staged only. It has no source or deployment. Nothing is running. The existing `awardsignal` project is untouched.
2. `railway.json` supplies Railpack, the normal Next.js build/start commands, one replica, an HTTP startup check, crash retries and app sleeping. It caps runtime resources at 1 CPU / 1 GiB; this is not a billing cap. Sleeping saves idle compute but adds a cold start; test its latency before taking customers. The root-page healthcheck proves the web process started, not that SMTP/Stripe/Supabase work.
3. The connector cannot update configuration on this staged-only service (`Service Instance not found`); the repository config is ready, but its hosted application is not verified. Attach only the exact tested launch branch/commit after secrets and account settings are ready. Do not merge or deploy the saved Library experiment.
4. Provision a dedicated Supabase Free project, apply `supabase/launch.sql`, configure email codes and custom SMTP, and supply credentials directly through private provider settings. The cost-confirmation operation is unavailable in the Supabase connector, so project creation currently needs the dashboard. Never invent its confirmation token.
5. Set the fields in `.env.example` on Railway. Public URL/key/app mode must be present while building. Use `RAILPACK_NODE_VERSION=24`, `NEXT_PUBLIC_APP_MODE=live`, `TRIPCOOKER_RELEASE_TARGET=preview` in staging, and initially `PAYMENTS_ENABLED=false`. Set `APP_URL` to that environment's verified HTTPS origin. No secret values have been set remotely.
6. Create the Stripe sandbox with an owner-supplied email address. The address can be an existing inbox; a new mailbox is not required. The anonymous sandbox CLI stopped at its required email field, so no sandbox exists yet. Do not infer an email from Git or another account. Set test prices/keys in staging, enable test payments, then run the real-provider acceptance checklist in `launch-readiness.md`.
7. Review business identity, support contact and policies. Confirm the live Stripe merchant and its payment/payout status; account display name alone is not verification. Keep checkout and portal branding consistent with TripCooker. No live charge or purchase is performed by these setup steps.
8. Prepare the production environment with `TRIPCOOKER_RELEASE_TARGET=production`; the build refuses missing live configuration or disabled payments. Railway's environment named `production` and Vercel production also trigger this guard automatically. Publish only after hosted acceptance. Switching app/credentials requires a rebuild, not promotion of a staging artifact with embedded public settings.
9. Measure the first week of resource use and set alerts. Workspace-wide hard limits shut down all workloads, including `awardsignal`, when reached; do not set them blindly for this one app. No workspace billing limit or plan upgrade has been applied.
10. Use the organic promotion drafts after a verified launch URL and successful live checkout. Choose a destination before posting. Track visitors, free-trip completion, Pro purchases, cancellations and actual hosting cost; start paid advertising only after the purchase path works and budget is specified.

No plan upgrade, billing subscription, domain purchase, production deployment or promotional post has been performed. This is preparation for a small paid MVP, not a claim that revenue already exists.
