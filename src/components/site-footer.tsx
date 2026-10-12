import Link from "next/link";
import { POLICY_RELEASE } from "@/lib/app-config";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-sand-200 px-4 py-7 text-center text-sm text-charcoal-500 ${className}`}>
      <p>TripCooker · Operated by {POLICY_RELEASE.operatorName}</p>
      <nav aria-label="Support and policies" className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link href="/support" className="underline underline-offset-4">Support</Link>
        <Link href="/terms" className="underline underline-offset-4">Terms</Link>
        <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>
        <Link href="/refunds" className="underline underline-offset-4">Cancellation & refunds</Link>
      </nav>
      <p className="mx-auto mt-3 max-w-lg text-xs">Editable planning templates and estimated budgets. Confirm bookings, prices, and event information independently.</p>
    </footer>
  );
}
