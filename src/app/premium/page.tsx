"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles } from "lucide-react";
import { FREE_FEATURES, LIVE_MODE, PRO_FEATURES } from "@/lib/app-config";
import { accountRequest } from "@/lib/auth-client";
import { updateUser, useDB } from "@/lib/store";
import { useAccount } from "@/components/account-provider";
import { AppShell, PageContainer } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function PremiumPage() {
  const db = useDB();
  const account = useAccount();
  const isPremium = db.user.plan === "premium";
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [billing, setBilling] = useState({
    canManage: false,
    checkoutAvailable: false,
  });
  useEffect(() => {
    if (!LIVE_MODE || account.phase !== "ready") return;
    void accountRequest("/api/billing/status")
      .then((result) => {
        setBilling(result);
        if (
          new URLSearchParams(window.location.search).get("checkout") ===
          "complete"
        )
          setMessage(
            "Checkout returned successfully. Refresh your account to confirm subscription access.",
          );
      })
      .catch(() => setMessage("Billing is temporarily unavailable."));
  }, [account.phase]);
  async function openBilling(portal = false) {
    setBusy(true);
    setMessage("");
    try {
      const result = await accountRequest(
        portal ? "/api/billing/portal" : "/api/billing/checkout",
        "POST",
        portal ? undefined : { interval },
      );
      window.location.assign(result.url);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Billing is temporarily unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell publicPage>
      <PageContainer>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="blue" className="mb-3">
            <Sparkles className="size-3" /> TripCooker Premium
          </Badge>
          <h1 className="text-3xl font-extrabold md:text-4xl">
            Build your travel year.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-charcoal-500">
            Plan one active trip free. Pro keeps multiple trips, your travel
            calendar, and yearly budget totals together.
          </p>
        </div>
        {isPremium && (
          <Card className="mx-auto mt-6 max-w-xl bg-emerald-50 p-5 text-center text-emerald-800">
            You’re on Travel Season Pro. Multiple trips and your Travel Year
            Calendar are unlocked.
          </Card>
        )}
        {message && (
          <p
            role="status"
            className="mx-auto mt-6 max-w-xl rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
          >
            {message}
          </p>
        )}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Free</h2>
            <p className="mt-1 text-3xl font-extrabold">$0</p>
            <p className="mt-1 text-sm text-charcoal-500">
              Cook one active trip at a time.
            </p>
            <ul className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/onboarding" className="mt-6 inline-block">
              <Button variant="outline">Start my free trip</Button>
            </Link>
          </Card>
          <Card className="border-ocean-700 bg-ocean-900 p-6 text-white">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Crown className="size-5 text-amber-300" /> Travel Season Pro
            </h2>
            <p className="mt-2 text-3xl font-extrabold">
              {interval === "monthly" ? "$7.99" : "$59"}
              <span className="text-sm font-normal text-ocean-200">
                /{interval === "monthly" ? "month" : "year"}
              </span>
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="text-charcoal-900"
                aria-pressed={interval === "monthly"}
                onClick={() => setInterval("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant="outline"
                className="text-charcoal-900"
                aria-pressed={interval === "yearly"}
                onClick={() => setInterval("yearly")}
              >
                Yearly · save 38%
              </Button>
            </div>
            <ul className="mt-5 space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-amber-300" />
                  {f}
                </li>
              ))}
            </ul>
            {!LIVE_MODE ? (
              <Button
                className="mt-6 w-full bg-white text-ocean-900"
                disabled={isPremium}
                onClick={() => updateUser({ plan: "premium" })}
              >
                {isPremium ? "Demo Pro enabled" : "Try Pro in demo · no charge"}
              </Button>
            ) : account.phase !== "ready" ? (
              <Link href="/sign-in" className="mt-6 block">
                <Button className="w-full bg-white text-ocean-900">
                  Sign in to continue
                </Button>
              </Link>
            ) : (
              <div className="mt-6 space-y-3">
                {!isPremium && (
                  <Button
                    className="w-full bg-white text-ocean-900"
                    disabled={busy || !billing.checkoutAvailable}
                    onClick={() => void openBilling()}
                  >
                    {billing.checkoutAvailable
                      ? "Subscribe with Stripe"
                      : "Subscriptions opening soon"}
                  </Button>
                )}
                {billing.canManage && (
                  <Button
                    className="w-full bg-white text-ocean-900"
                    disabled={busy}
                    onClick={() => void openBilling(true)}
                  >
                    Manage billing / Cancel subscription
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full text-white"
                  disabled={busy}
                  onClick={() =>
                    void account
                      .refresh()
                      .then(() => setMessage("Account refreshed."))
                      .catch((e) => setMessage(e.message))
                  }
                >
                  Refresh subscription status
                </Button>
              </div>
            )}
            <p className="mt-3 text-xs text-ocean-200">
              {LIVE_MODE
                ? "Subscriptions renew automatically. Cancel through Manage billing. Your access continues until the paid period ends. Taxes, if applicable, are shown at checkout."
                : "Demo preview only. No card, subscription, or payment."}
            </p>
            <p className="mt-3 text-xs text-ocean-200">
              Read the <Link href="/terms" className="underline">Terms</Link>, <Link href="/privacy" className="underline">Privacy policy</Link>, and <Link href="/refunds" className="underline">Cancellation & refunds</Link> before subscribing.
            </p>
          </Card>
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-charcoal-500">
          TripCooker creates editable plans from travel templates. Costs are
          estimates; confirm schedules, availability, and bookings yourself.
        </p>
      </PageContainer>
    </AppShell>
  );
}
