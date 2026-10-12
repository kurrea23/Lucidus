import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection, SupportContact } from "@/components/policy-page";
import { POLICIES_APPROVED } from "@/lib/app-config";
export const metadata: Metadata = { title: "Terms · TripCooker", robots: { index: POLICIES_APPROVED, follow: true } };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of service" description="The terms for using TripCooker and purchasing Travel Season Pro.">
      <PolicySection title="Who we are and what we provide">
        <p>Lucidum L.C. operates TripCooker, a website for creating and editing travel plans, estimated budgets, itineraries, packing lists, and tasks. Plans use travel templates. We do not book travel, sell tickets, guarantee availability, or provide a live pricing or event schedule service. Verify travel arrangements and requirements with the relevant providers.</p>
      </PolicySection>
      <PolicySection title="Your account and content">
        <p>You must be at least 18 to create an account or purchase a subscription. Use an email address you control and keep your sign-in codes private. You retain ownership of the information you enter and allow us to store and process it to provide the service. Do not upload unlawful content, another person’s private information without permission, passwords, payment-card details, or identity documents. Do not interfere with other accounts or misuse the service.</p>
      </PolicySection>
      <PolicySection title="Free and paid plans">
        <p>Free allows one active trip at a time, with completed and archived trips retained. Travel Season Pro provides multiple active trips, the Travel Year Calendar, and yearly budget totals. Pro costs US $7.99 per month or US $59 per year, billed in advance on the interval you select. Any applicable taxes and the total are shown before you authorize payment. There is no trial or required payment card for Free.</p>
      </PolicySection>
      <PolicySection title="Renewal, cancellation, and refunds">
        <p>Pro renews automatically at the selected interval until canceled. Cancel using Manage billing on the Plans & billing page before the next renewal. Access continues through the paid period. Canceling billing does not delete your account or trip data. Existing trips remain accessible on Free, but creating additional active trips requires Pro or completing or archiving an active trip. Read the <Link href="/refunds" className="underline">cancellation and refund policy</Link> for refund requests.</p>
      </PolicySection>
      <PolicySection title="Availability and changes">
        <p>Travel plans and budgets are estimates. We cannot promise uninterrupted access, accuracy of third-party travel information, or particular travel outcomes. Export important plans before traveling. We may restrict misuse or suspend service for security or maintenance. If we change subscription prices, we will notify affected customers before their next charge and allow cancellation. Material policy changes will be announced before they apply.</p>
      </PolicySection>
      <PolicySection title="Your rights and support">
        <p>Nothing in these terms limits rights or remedies that applicable law does not allow us to exclude. Our <Link href="/privacy" className="underline">privacy policy</Link> explains account data and deletion. For service, billing, or policy questions, contact <SupportContact />.</p>
      </PolicySection>
    </PolicyPage>
  );
}
