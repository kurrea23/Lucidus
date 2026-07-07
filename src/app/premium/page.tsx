"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Loader2, LogIn, PartyPopper, Sparkles } from "lucide-react";
import { updateUser, useDB } from "@/lib/store";
import { getSupabase, isCloudEnabled } from "@/lib/supabase/client";
import { refreshPlan } from "@/lib/supabase/sync";
import { AppShell, PageContainer } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FREE = [
  "1 active trip",
  "Travel DNA profile",
  "Trip dashboard & readiness score",
  "Checklist & packing list",
  "Budget & itinerary",
  "Festival Mode for your trip",
];

const PRO = [
  "Unlimited trips",
  "Yearly travel calendar",
  "Annual travel budget",
  "Group planning",
  "Split costs",
  "Advanced Festival Mode",
  "AI concierge",
  "Trip archive",
];

export default function PremiumPage() {
  const db = useDB();
  const cloud = isCloudEnabled();
  const signedIn = Boolean(db.user.isCloud);
  const isPremium = db.user.plan === "premium";

  const [justJoined, setJustJoined] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState<"monthly" | "yearly" | null>(null);
  const [message, setMessage] = useState("");
  const [returnedFromCheckout, setReturnedFromCheckout] = useState(false);

  // Returning from Stripe checkout: ?success=1 — webhook flips the plan, so
  // re-pull it (it can lag a few seconds behind the redirect).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") !== "1") return;
    const show = setTimeout(() => setReturnedFromCheckout(true), 0);
    void refreshPlan();
    const timer = setInterval(() => void refreshPlan(), 3000);
    const stop = setTimeout(() => clearInterval(timer), 30000);
    return () => {
      clearTimeout(show);
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, []);

  function demoUpgrade() {
    // Local demo mode only — real upgrades go through Stripe checkout.
    updateUser({ plan: "premium" });
    setJustJoined(true);
  }

  async function startCheckout(interval: "monthly" | "yearly") {
    const sb = getSupabase();
    if (!sb) return;
    setCheckoutBusy(interval);
    setMessage("");
    try {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessage("Please sign in first.");
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interval }),
      });
      if (res.status === 501) {
        setMessage(
          "Payments aren't switched on for this deployment yet (Stripe keys not configured)."
        );
        return;
      }
      if (!res.ok) {
        setMessage("Something went wrong starting checkout. Please try again.");
        return;
      }
      const { url } = (await res.json()) as { url?: string };
      if (url) window.location.href = url;
    } finally {
      setCheckoutBusy(null);
    }
  }

  return (
    <AppShell>
      <PageContainer>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="blue" className="mb-3">
            <Sparkles className="size-3" /> TripCooker Premium
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Build your travel year.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-charcoal-500">
            Free users can plan one trip. Premium unlocks unlimited trips, yearly
            calendar planning, annual budget tracking, group planning, and advanced
            Festival Mode.
          </p>
        </div>

        {returnedFromCheckout && !isPremium && (
          <Card className="mx-auto mt-6 max-w-xl border-ocean-200 bg-ocean-50 p-5 text-center">
            <p className="flex items-center justify-center gap-2 font-semibold text-ocean-800">
              <Loader2 className="size-4 animate-spin" /> Payment received — activating
              Premium…
            </p>
            <p className="mt-1 text-sm text-ocean-700">
              This usually takes a few seconds.
            </p>
          </Card>
        )}

        {(isPremium || justJoined) && (
          <Card className="mx-auto mt-6 max-w-xl border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="font-semibold text-emerald-800">
              {justJoined ? "Welcome to Travel Season Pro! 🎉" : "You're on Travel Season Pro."}
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Unlimited trips and your Travel Year Calendar are unlocked.
            </p>
          </Card>
        )}

        {message && (
          <p className="mx-auto mt-6 max-w-xl rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
            {message}
          </p>
        )}

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
          {/* Free */}
          <Card className="p-6">
            <h2 className="text-lg font-bold">Free</h2>
            <p className="mt-1 text-3xl font-extrabold">
              $0<span className="text-sm font-normal text-charcoal-400">/forever</span>
            </p>
            <p className="mt-1 text-sm text-charcoal-500">Cook your first trip.</p>
            <ul className="mt-4 space-y-2">
              {FREE.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-charcoal-700">
                  <Check className="size-4 shrink-0 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" disabled>
              {isPremium ? "Included in Pro" : "Your current plan"}
            </Button>
          </Card>

          {/* Pro */}
          <Card className="relative border-ocean-700 bg-ocean-900 p-6 text-white">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-300 text-charcoal-900">
              Most popular
            </Badge>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Crown className="size-5 text-amber-300" /> Travel Season Pro
            </h2>
            <p className="mt-1 text-3xl font-extrabold">
              $7.99<span className="text-sm font-normal text-ocean-200">/month</span>
            </p>
            <p className="mt-1 text-sm text-ocean-200">or $59/year — 2 months free.</p>
            <ul className="mt-4 space-y-2">
              {PRO.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-amber-300" />
                  {f}
                  {f === "Advanced Festival Mode" && (
                    <PartyPopper className="size-3.5 text-neon-400" />
                  )}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <Button className="mt-6 w-full bg-white text-ocean-900" disabled>
                You&apos;re a member
              </Button>
            ) : cloud && signedIn ? (
              <div className="mt-6 space-y-2">
                <Button
                  className="w-full bg-white text-ocean-900 hover:bg-sand-100"
                  onClick={() => void startCheckout("monthly")}
                  disabled={checkoutBusy !== null}
                >
                  {checkoutBusy === "monthly" && <Loader2 className="size-4 animate-spin" />}
                  Join Premium — $7.99/mo
                </Button>
                <Button
                  className="w-full bg-ocean-700 text-white hover:bg-ocean-600"
                  onClick={() => void startCheckout("yearly")}
                  disabled={checkoutBusy !== null}
                >
                  {checkoutBusy === "yearly" && <Loader2 className="size-4 animate-spin" />}
                  Join yearly — $59/yr
                </Button>
                <p className="text-center text-xs text-ocean-300">
                  Secure checkout by Stripe.
                </p>
              </div>
            ) : cloud ? (
              <div className="mt-6">
                <Link href="/login">
                  <Button className="w-full bg-white text-ocean-900 hover:bg-sand-100">
                    <LogIn className="size-4" /> Sign in to join Premium
                  </Button>
                </Link>
                <p className="mt-2 text-center text-xs text-ocean-300">
                  Premium attaches to your account so it works on every device.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <Button
                  className="w-full bg-white text-ocean-900 hover:bg-sand-100"
                  onClick={demoUpgrade}
                >
                  Join Premium
                </Button>
                <p className="mt-2 text-center text-xs text-ocean-300">
                  Demo build — upgrades instantly, no card needed.
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
