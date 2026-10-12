# Lucidum L.C. — TripCooker policy review

Status: draft, not approved or published as final. Policy revision: **2026-10-11-v1**. The owner has confirmed the operator name **Lucidum L.C.** only. No Stripe legal identity, bank, account-level business description or support setting has been changed. Inactive TripCooker catalog/portal objects have been prepared; see the provider audit in `launch-readiness.md`.

Review the actual `/terms`, `/privacy`, `/refunds` and `/support` pages before approving this revision. The proposed business commitments are:

- Adults 18 and over; direct consumer planning software. No bookings, tickets, guaranteed live information or physical delivery.
- Pro at $7.99/month or $59/year, billed in advance, renewing automatically. Free needs no payment card.
- Cancellation through the Stripe portal at period end; existing trips retained and editable on Free. Deleting trip data does not cancel billing.
- A full refund of the first Pro payment requested within seven days. This covers the initial monthly or annual payment; a full refund ends Pro and stops renewal. Renewal/partial-period refunds are normally case by case, with legally required remedies preserved.
- Verified account-deletion requests handled within a proposed 30-day window; recovery copies retained at most 30 days. Required financial/security/legal records retained only for their necessary purposes. Deleted accounts must be excluded from a recovery restore.
- No sale of trip data or advertising profiling in this release. The privacy page describes the actual saved planner data and browser recovery storage.

Before final approval, verify the support inbox/forwarding, identify the selected sign-in email provider, verify deletion/refund handling and scheduled off-site recovery, and review the complete text for the actual launch markets. These are business commitments, not a claim of legal review or jurisdiction-wide compliance.

After explicit owner approval and contact verification, set `NEXT_PUBLIC_SUPPORT_EMAIL` to the real public contact and `NEXT_PUBLIC_APPROVED_POLICY_VERSION` to the exact reviewed revision, then rebuild. The version must change whenever a material policy changes. Draft pages are marked for review and excluded from indexing. Production configuration and new live checkout reject missing contact or an unapproved revision.

Configure Stripe Checkout's public support, terms, privacy and refund links and activate the dedicated non-default portal. Its proposed cancellation behavior is prepared but inactive. Checkout explicitly collects Stripe's terms consent and records the policy revision in metadata; the account's Terms URL must be configured before hosted acceptance. Public legal/support links have not been configured remotely yet. See [Stripe Checkout](https://docs.stripe.com/payments/checkout/custom-components) and [consumer subscription guidance](https://www.ftc.gov/news-events/news/press-releases/2021/10/ftc-ramp-enforcement-against-illegal-dark-patterns-trick-or-trap-consumers-subscriptions).

For a first Free launch while Stripe reviews payouts, set `TRIPCOOKER_FREE_LAUNCH=true` and `PAYMENTS_ENABLED=false`. Account saving, email delivery, reviewed policies, support, backup/recovery and hosted acceptance are still required. New purchases stay closed even if the payment flag is accidentally changed. Existing Stripe-hosted sessions or renewals are not revoked by this flag. Completing a Free release does not complete the paid-launch goal.
