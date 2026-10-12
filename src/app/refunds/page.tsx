import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, SupportContact } from "@/components/policy-page";
import { POLICY_RELEASE, POLICIES_APPROVED } from "@/lib/app-config";
export const metadata: Metadata = { title: "Cancellation & refunds · TripCooker", robots: { index: POLICIES_APPROVED, follow: true } };

export default function RefundsPage() {
  return (
    <PolicyPage title="Cancellation & refunds" description="How to stop renewal, request a refund, and keep access to your travel plans.">
      <PolicySection title="Cancel renewal yourself">
        <p>Sign in, open <Link href="/premium" className="underline">Plans & billing</Link>, choose Manage billing / Cancel subscription, and complete cancellation in Stripe’s billing portal. Check the confirmation and the displayed end date. Cancel before the next renewal to stop the next charge. If you cannot access the portal, contact support from your account email before the renewal date.</p>
      </PolicySection>
      <PolicySection title="What cancellation changes">
        <p>Pro remains available until the end of the paid period. After that, your account returns to Free. Your existing trips remain accessible and editable. Free allows one active trip; complete or archive active trips to make room for a new one. Deleting trip data or signing out does not cancel a subscription.</p>
      </PolicySection>
      <PolicySection title="First-payment refund">
        <p>You may request a full refund of your first TripCooker Pro payment within {POLICY_RELEASE.firstPaymentRefundDays} days of that payment. This applies to either the monthly or annual plan. Contact support from your account email with the payment date or receipt reference. Do not send full card details. An approved full refund ends Pro access and stops future renewal; your account and existing trips remain available on Free.</p>
      </PolicySection>
      <PolicySection title="Other requests">
        <p>Cancellation normally stops future renewal and does not automatically refund a renewal payment or an unused portion of a paid period. Contact us about duplicate charges, billing mistakes, unauthorized payments, or a service issue; we review these requests individually. Applicable consumer rights and legally required refunds take precedence over this policy. Refund timing depends on Stripe and your payment provider; we do not promise an exact bank processing time.</p>
      </PolicySection>
      <PolicySection title="Contact">
        <p>For cancellation help or a refund request: <SupportContact />.</p>
      </PolicySection>
    </PolicyPage>
  );
}
