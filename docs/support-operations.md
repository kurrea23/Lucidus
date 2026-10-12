# TripCooker support operations — preparation

Operator: **Lucidum L.C.** Public support delivery and the proposed policy revision are not yet approved or verified. No support message, refund, account deletion or payout request has been sent or performed.

## Before opening accounts

Verify the public support alias routes to the owner's chosen private inbox. Test a message in both directions, including a reply from the public alias. Forwarding alone does not configure outgoing replies. Keep sender credentials private and scoped to the verified TripCooker domain; do not expose the private destination on the website. Publish the contact and final policies only after these checks and owner approval.

## Account or billing requests

- Verify control of the registered account email using a private confirmation reply or authenticated confirmation before changing or deleting an account. An incoming From header, a screenshot, user ID or receipt number alone is not proof of ownership. Never ask for sign-in codes, passwords, full card numbers or identity documents in chat/email.
- Resolve the user ID and Stripe customer through the dedicated project's server-owned mapping. Do not guess ownership from matching email addresses across Stripe customers or reuse an unrelated company customer.
- For cancellation, guide the customer to their authenticated TripCooker portal. If a verified customer cannot access it and asks support to cancel, record the request, cancel at period end, confirm the end date and verify current subscription state. Do not alter another app's subscription or portal defaults.
- For an approved first-payment refund under the proposed policy, verify the original payment and request date. Cancel the applicable subscription **immediately without additional prorations** as part of the full-refund process, then process the approved refund and verify both operations. A Stripe refund by itself does not cancel renewal; an invoice can remain paid after refund, so current active subscription status must end too. Never issue a second refund after a timeout without retrieving its current status. Refunds and cancellation are individual customer-authorized financial actions, not launch setup actions.
- For full account closure, explain that closure ends access and does not automatically grant a refund. Verify ownership and any refund eligibility, stop subscription renewal, revoke sessions using the supported admin flow, and delete the dedicated auth user so private planner/billing mappings cascade. Confirm the resulting state. Customer payment records needed for financial/legal obligations remain with the payment provider.
- Keep the minimum private audit record and an encrypted deletion register separate from recovery snapshots. Before a recovery restore reconnects to customers, apply deletion exclusions and verify that deleted users cannot return. Expire snapshots according to the approved retention policy, including off-site copies.

## Stripe payout review — owner draft, not sent

Use Stripe's authenticated support channel under the company account if the pending business review needs clarification. Review the following text before sending; update the website sentence only after deployment is actually verified.

> Lucidum L.C. has submitted the requested business product/service information for this account. The latest account read permits charges and payouts, but the Dashboard still requires an active website and business clarification with a November 10, 2026 deadline on the detailed task page. Please confirm what additional information is required to complete that follow-up. We are preparing TripCooker, consumer travel-planning software at US $7.99/month or $59/year, and have not opened paid checkout or charged TripCooker customers. The tripcooker.com domain is configured, but the website deployment is still in preparation. Please let us know whether a working website or other business documentation is needed for the review.

Do not send private identity numbers, credentials or bank details in this draft. Do not create another live Stripe account to evade the existing review. No review-completion or payout timeline is promised.
