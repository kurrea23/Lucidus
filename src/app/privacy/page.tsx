import type { Metadata } from "next";
import { PolicyPage, PolicySection, SupportContact } from "@/components/policy-page";
import { POLICY_RELEASE, POLICIES_APPROVED } from "@/lib/app-config";
export const metadata: Metadata = { title: "Privacy · TripCooker", robots: { index: POLICIES_APPROVED, follow: true } };

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy policy" description="How Lucidum L.C. handles information when you use TripCooker.">
      <PolicySection title="Information you provide">
        <p>We process your account email and identifier, display name, travel preferences, destinations, dates, estimated budgets, itineraries, packing lists, tasks, and notes you choose to save. Travel details can be sensitive. Enter only what you need for planning. Support requests contain the information you send us.</p>
      </PolicySection>
      <PolicySection title="Payments and technical information">
        <p>Stripe handles payment-card information on its hosted checkout and billing portal. TripCooker stores customer identifiers and limited billing event records to associate your subscription with your account; it does not store full card numbers. Our hosting, domain, authentication, email, and payment providers process technical information such as IP addresses and request or delivery logs for operation, security, and troubleshooting.</p>
      </PolicySection>
      <PolicySection title="How we use and share information">
        <p>We use information to sign you in, save and display your plans, provide paid features, handle support and refunds, and protect accounts. Service providers include Supabase for accounts and database storage, Railway for website hosting, Cloudflare for domain services, Stripe for payments, and the configured email delivery provider for sign-in messages. Providers process information needed for these services under their own applicable terms and policies. We may disclose information when legally required or necessary to protect the service. We do not sell trip data or use it for advertising profiles.</p>
      </PolicySection>
      <PolicySection title="Browser storage and demo mode">
        <p>Authentication uses browser storage to keep you signed in. Account-specific unsaved edits may be kept in session storage so you can recover them in the same browser session. Demo mode stores its trips in your browser and does not create a cloud account. Data you export is a private file on your device. Use a trusted device and sign out after using a shared device. TripCooker does not include advertising trackers in this release.</p>
      </PolicySection>
      <PolicySection title="Retention and deletion">
        <p>We retain account and trip information while your account remains open. You can export your data or delete trip data in Settings. Deleting trips does not delete your account or cancel billing. To close your account, contact support from your account email; we verify the request and aim to remove account and trip data from active systems within {POLICY_RELEASE.deletionWindowDays} days. Necessary payment, support, security, and legal records may be retained for their required purposes. Recovery copies can retain deleted information for up to {POLICY_RELEASE.backupRetentionDays} days and must not be used to restore a deleted account to ordinary service.</p>
      </PolicySection>
      <PolicySection title="Security and your choices">
        <p>We use access controls and secure connections to protect information, but cannot guarantee that every system is free of risk. Do not send passwords, sign-in codes, full card details, or identity documents in support messages. Depending on where you live, you may have rights to access, correct, export, or delete information. Contact us to exercise those rights or ask a privacy question. This service is intended for adults aged 18 and over.</p>
      </PolicySection>
      <PolicySection title="Contact and changes">
        <p>Privacy contact: <SupportContact />. We will publish policy changes here and notify account holders before material changes take effect.</p>
      </PolicySection>
    </PolicyPage>
  );
}
