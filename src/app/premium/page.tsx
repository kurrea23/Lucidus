"use client";

import { useState } from "react";
import { Check, Crown, PartyPopper, Sparkles } from "lucide-react";
import { updateUser, useDB } from "@/lib/store";
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
  const isPremium = db.user.plan === "premium";
  const [justJoined, setJustJoined] = useState(false);

  function joinPremium() {
    // MVP: demo upgrade — a real build would route through Stripe checkout.
    updateUser({ plan: "premium" });
    setJustJoined(true);
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
            <Button
              className="mt-6 w-full bg-white text-ocean-900 hover:bg-sand-100"
              onClick={joinPremium}
              disabled={isPremium}
            >
              {isPremium ? "You're a member" : "Join Premium"}
            </Button>
            {!isPremium && (
              <p className="mt-2 text-center text-xs text-ocean-300">
                Demo build — upgrades instantly, no card needed.
              </p>
            )}
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
