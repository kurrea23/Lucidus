import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, SupportContact } from "@/components/policy-page";
import { POLICIES_APPROVED } from "@/lib/app-config";
export const metadata: Metadata = { title: "Support · TripCooker", robots: { index: POLICIES_APPROVED, follow: true } };

export default function SupportPage() {
  return (
    <PolicyPage title="How can we help?" description="TripCooker support is provided by Lucidum L.C.">
      <PolicySection title="Contact support">
        <p><SupportContact /></p>
        <p>For account or billing help, write from your account email. Include a short description of the issue and, if relevant, your payment date or receipt reference. Avoid private travel details unless they are needed. Never send passwords, sign-in codes, API keys, full card details, or identity documents.</p>
      </PolicySection>
      <PolicySection title="Sign-in or saving problems">
        <p>Check your inbox and spam folder for your email code. Use the newest code or request another. If saving fails, keep the page open, export your data, and use Retry. When the app reports a conflict, export your edits before choosing to reload the account. Tell support what happened and which device or browser you used.</p>
      </PolicySection>
      <PolicySection title="Billing, cancellation, and refunds">
        <p>Open <Link href="/premium" className="underline">Plans & billing</Link> to manage or cancel a subscription. Read the <Link href="/refunds" className="underline">cancellation and refund policy</Link> before purchasing. Contact support if you cannot reach the billing portal or believe a charge is incorrect.</p>
      </PolicySection>
      <PolicySection title="Export or close your account">
        <p>Export a JSON copy from Settings before deleting anything. Deleting trip data keeps your account and subscription open. To close the entire account, contact support from your account email. We verify ownership, stop any subscription renewal, and delete account data according to the <Link href="/privacy" className="underline">privacy policy</Link>. Account closure ends your access and does not automatically grant a refund. If you only want to stop renewal, use Manage billing.</p>
      </PolicySection>
    </PolicyPage>
  );
}
