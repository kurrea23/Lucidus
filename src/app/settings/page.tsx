"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetAll, updateUser, useDB } from "@/lib/store";
import { LIVE_MODE } from "@/lib/app-config";
import { useAccount } from "@/components/account-provider";
import { exportTripData } from "@/components/save-status";
import { AppShell, PageContainer, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { TravelDNACard } from "@/components/travel-dna-card";
export default function SettingsPage() {
  const db = useDB();
  const router = useRouter();
  const account = useAccount();
  const [message, setMessage] = useState("");
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
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Display name</Label>
                <Input
                  key={db.user.id + db.user.displayName}
                  id="name"
                  defaultValue={db.user.displayName}
                  onBlur={(e) =>
                    updateUser({ displayName: e.target.value || "Traveler" })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">
                  {LIVE_MODE ? "Account email" : "Email (demo mode)"}
                </Label>
                <Input
                  key={db.user.id}
                  id="email"
                  type="email"
                  readOnly={LIVE_MODE}
                  defaultValue={db.user.email}
                  onBlur={(e) => {
                    if (!LIVE_MODE) updateUser({ email: e.target.value });
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {db.user.plan === "premium" ? "Travel Season Pro" : "Free plan"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-charcoal-500">
                {db.user.plan === "premium"
                  ? "Multiple trips, Travel Year Calendar, and yearly budget totals."
                  : "One active trip. Complete or archive it when you're ready to start the next."}
              </p>
              <Link href="/premium">
                <Button>
                  {db.user.plan === "premium"
                    ? "Manage plan & billing"
                    : "Explore Travel Season Pro"}
                </Button>
              </Link>
              {!LIVE_MODE && db.user.plan === "premium" && (
                <Button
                  variant="outline"
                  onClick={() => updateUser({ plan: "free" })}
                >
                  Switch to Free (demo)
                </Button>
              )}
            </CardContent>
          </Card>
          {db.travelProfile && <TravelDNACard profile={db.travelProfile} />}
          <Card>
            <CardHeader>
              <CardTitle>Your data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-charcoal-500">
                Download a JSON backup of your trips and profile. Keep it
                private; it may include travel and emergency details.
              </p>
              <Button variant="outline" onClick={exportTripData}>
                Export my data
              </Button>
              {LIVE_MODE && (
                <Button
                  variant="outline"
                  onClick={() =>
                    void account
                      .signOut()
                      .then(() => router.push("/"))
                      .catch((e) => setMessage(e.message))
                  }
                >
                  Sign out
                </Button>
              )}
              {message && <p role="status">{message}</p>}
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Delete trip data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-charcoal-500">
                {LIVE_MODE
                  ? "Delete all your trips and Travel DNA. Your account and subscription remain active. Use Manage billing to cancel a subscription."
                  : "Reset all browser demo trips, profile, and plan."}
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    confirm(
                      "Delete all trip data? Export a backup first. This cannot be undone.",
                    )
                  ) {
                    resetAll();
                    router.push("/dashboard");
                  }
                }}
              >
                {LIVE_MODE ? "Delete all trip data" : "Reset demo data"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
