"use client";

import { useRouter } from "next/navigation";
import { Crown, RotateCcw, UserRound } from "lucide-react";
import { resetAll, updateUser, useDB } from "@/lib/store";
import { AppShell, PageContainer, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { TravelDNACard } from "@/components/travel-dna-card";

export default function SettingsPage() {
  const db = useDB();
  const router = useRouter();
  const isPremium = db.user.plan === "premium";

  return (
    <AppShell>
      <PageContainer className="max-w-3xl">
        <PageHeader
          title="Settings"
          description="Your profile, plan, and travel preferences."
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4 text-ocean-600" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  defaultValue={db.user.displayName}
                  onBlur={(e) => updateUser({ displayName: e.target.value || "Traveler" })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email (demo mode)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  defaultValue={db.user.email}
                  onBlur={(e) => updateUser({ email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="size-4 text-ocean-600" /> Plan
              </CardTitle>
              <Badge variant={isPremium ? "blue" : "default"}>
                {isPremium ? "Travel Season Pro" : "Free"}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-charcoal-500">
                {isPremium
                  ? "Unlimited trips, Travel Year Calendar, and annual budget tracking."
                  : "One active trip. Upgrade to build your whole travel year."}
              </p>
              {isPremium ? (
                <Button variant="outline" onClick={() => updateUser({ plan: "free" })}>
                  Switch to Free (demo)
                </Button>
              ) : (
                <Button onClick={() => router.push("/premium")}>
                  <Crown className="size-4" /> Unlock Travel Season Pro
                </Button>
              )}
            </CardContent>
          </Card>

          {db.travelProfile && <TravelDNACard profile={db.travelProfile} />}

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-charcoal-500">
                Reset all local demo data — trips, profile, and plan.
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Reset all TripCooker data? This cannot be undone.")) {
                    resetAll();
                    router.push("/");
                  }
                }}
              >
                <RotateCcw className="size-4" /> Reset demo data
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
