"use client";

import Link from "next/link";
import { CalendarDays, Crown, Lock, Plus } from "lucide-react";
import { calculateReadinessScore } from "@/lib/readiness";
import {
  tripBudget,
  tripItinerary,
  tripPacking,
  tripTasks,
  useDB,
} from "@/lib/store";
import { formatMoney, parseISODate, todayISO } from "@/lib/utils";
import { AppShell, PageContainer, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, StatCard } from "@/components/shared";
import { TripCard } from "@/components/trip-card";

const MOCK_YEAR = [
  { month: "May", trip: "EDC Las Vegas" },
  { month: "July", trip: "Beach Trip" },
  { month: "September", trip: "Lost Lands" },
  { month: "November", trip: "EDSea" },
];

function LockedPreview() {
  return (
    <div>
      <Card className="bg-ocean-900 p-10 text-center text-white">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/10">
          <Lock className="size-5" />
        </span>
        <h2 className="text-3xl font-bold">Build your travel year.</h2>
        <p className="mx-auto mt-3 max-w-lg text-ocean-200">
          TripCooker Premium lets you plan multiple trips, view your yearly travel
          calendar, and track your annual travel budget.
        </p>
        <Link href="/premium" className="mt-6 inline-block">
          <Button size="lg" className="bg-white text-ocean-900 hover:bg-sand-100">
            <Crown className="size-4" /> Unlock Travel Season Pro
          </Button>
        </Link>
      </Card>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {MOCK_YEAR.map((m) => (
          <Card
            key={m.month}
            className="border-dashed bg-sand-50 p-5 text-center opacity-80"
          >
            <p className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
              <CalendarDays className="size-3" /> {m.month}
            </p>
            <p className="mt-2 text-sm font-medium text-charcoal-700">{m.trip}</p>
            <Lock className="mx-auto mt-2 size-3.5 text-charcoal-400" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const db = useDB();
  const isPremium = db.user.plan === "premium";

  const bundles = db.trips.map((trip) => ({
    trip,
    budgetItems: tripBudget(db, trip.id),
    packingItems: tripPacking(db, trip.id),
    itineraryItems: tripItinerary(db, trip.id),
    travelTasks: tripTasks(db, trip.id),
  }));

  const annualCost = bundles.reduce(
    (sum, b) => sum + b.budgetItems.reduce((s, i) => s + i.estimatedAmount, 0),
    0
  );
  const upcoming = bundles
    .filter((b) => b.trip.startDate && b.trip.startDate >= todayISO())
    .sort((a, b) => a.trip.startDate!.localeCompare(b.trip.startDate!))[0];

  const byMonth = new Map<string, typeof bundles>();
  for (const b of [...bundles].sort((x, y) =>
    (x.trip.startDate ?? "9999").localeCompare(y.trip.startDate ?? "9999")
  )) {
    const key = b.trip.startDate
      ? parseISODate(b.trip.startDate).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "Unscheduled";
    byMonth.set(key, [...(byMonth.get(key) ?? []), b]);
  }

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Travel Year Calendar"
          description={
            isPremium
              ? "Every trip in your travel season, month by month."
              : "A Premium view of your whole travel year."
          }
          actions={
            isPremium ? (
              <Link href="/trips/new">
                <Button>
                  <Plus className="size-4" /> New Trip
                </Button>
              </Link>
            ) : undefined
          }
        />

        {!isPremium ? (
          <LockedPreview />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Trips this year" value={db.trips.length} />
              <StatCard label="Annual travel cost" value={formatMoney(annualCost)} accent="blue" />
              <StatCard
                label="Next trip"
                value={upcoming ? upcoming.trip.destination : "—"}
                hint={upcoming?.trip.startDate ?? undefined}
              />
              <StatCard
                label="Next trip readiness"
                value={upcoming ? `${calculateReadinessScore(upcoming)}%` : "—"}
                accent={upcoming ? "green" : "default"}
              />
            </div>

            {byMonth.size === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Your travel year is empty"
                description="Cook a trip and it will show up here, organized by month."
                action={
                  <Link href="/trips/new">
                    <Button>
                      <Plus className="size-4" /> Cook a trip
                    </Button>
                  </Link>
                }
              />
            ) : (
              [...byMonth.entries()].map(([month, monthBundles]) => (
                <div key={month}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
                    {month}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {monthBundles.map((b) => (
                      <TripCard key={b.trip.id} bundle={b} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
