import Link from "next/link";
import { POLICY_RELEASE, POLICIES_APPROVED, SUPPORT_EMAIL } from "@/lib/app-config";
import { SiteFooter } from "./site-footer";

export function SupportContact() {
  return SUPPORT_EMAIL ? (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-ocean-700 underline underline-offset-4">{SUPPORT_EMAIL}</a>
  ) : <span>Support contact is being set up</span>;
}

export function PolicyPage({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <header className="border-b border-sand-200 bg-white px-4 py-4">
        <nav aria-label="Policy navigation" className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="font-bold text-ocean-700">TripCooker</Link>
          <Link href="/premium" className="text-sm underline underline-offset-4">Plans & billing</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:py-12">
        {!POLICIES_APPROVED && (
          <aside className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" aria-label="Draft policy notice">
            <strong>Draft for owner review.</strong> These policies take effect only when published as final. Paid subscriptions are not open yet.
          </aside>
        )}
        <h1 className="text-3xl font-bold text-charcoal-900">{title}</h1>
        <p className="mt-3 text-charcoal-600">{description}</p>
        <p className="mt-3 text-xs text-charcoal-500">{POLICY_RELEASE.operatorName} · Policy version {POLICY_RELEASE.version}</p>
        <div className="mt-8 space-y-8 text-sm leading-7 text-charcoal-700">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-lg font-semibold text-charcoal-900">{title}</h2>{children}</section>;
}
