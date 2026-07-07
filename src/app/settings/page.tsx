"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudUpload, Crown, LogIn, LogOut, RotateCcw, UserRound } from "lucide-react";
import { resetAll, updateUser, useDB } from "@/lib/store";
import { getSupabase, isCloudEnabled } from "@/lib/supabase/client";
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
  const cloud = isCloudEnabled();
  const signedIn = Boolean(db.user.isCloud);

  return (
    <AppShell>
      <PageContainer className="max-w-3xl">
        <PageHeader
          title="Settings"
          description="Your profile, plan, and travel preferences."
        />

        <div className="space-y-4">
          {cloud && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CloudUpload className="size-4 text-ocean-600" /> Account
                </CardTitle>
                <Badge variant={signedIn ? "green" : "default"}>
                  {signedIn ? "Signed in" : "Demo mode"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                {signedIn ? (
                  <>
                    <p className="text-sm text-charcoal-500">
                      Signed in as{" "}
                      <span className="font-medium text-charcoal-900">{db.user.email}</span>.
                      Trips sync to your account on every device.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => void getSupabase()?.auth.signOut()}
                    >
                      <LogOut className="size-4" /> Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-charcoal-500">
                      Trips currently save in this browser only. Create an account to
                      keep them safe and synced.
                    </p>
                    <Link href="/login">
                      <Button>
                        <LogIn className="size-4" /> Sign in / Create account
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>
          )}

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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  defaultValue={db.user.email}
                  disabled={signedIn}
                  onBlur={(e) => updateUser({ email: e.target.value })}
                />
                {signedIn && (
                  <p className="mt-1 text-xs text-charcoal-400">
                    Your sign-in email — managed by your account.
                  </p>
                )}
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
                  ? signedIn
                    ? "Unlimited trips and the Travel Year Calendar, attached to your account. Billing is handled by Stripe."
                    : "Unlimited trips, Travel Year Calendar, and annual budget tracking (demo)."
                  : "One active trip. Upgrade to build your whole travel year."}
              </p>
              {isPremium ? (
                signedIn ? null : (
                  <Button variant="outline" onClick={() => updateUser({ plan: "free" })}>
                    Switch to Free (demo)
                  </Button>
                )
              ) : (
                <Button onClick={() => router.push("/premium")}>
                  <Crown className="size-4" /> Unlock Travel Season Pro
                </Button>
              )}
            </CardContent>
          </Card>

          {db.travelProfile && <TravelDNACard profile={db.travelProfile} />}

          {!signedIn && (
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
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
