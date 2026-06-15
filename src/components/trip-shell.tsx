"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, PartyPopper, Timer, Trash2 } from "lucide-react";
import type { TripBundle } from "@/lib/readiness";
import {
  deleteTrip,
  getTrip,
  tripBudget,
  tripItinerary,
  tripPacking,
  tripTasks,
  updateTrip,
  useDB,
  type DB,
} from "@/lib/store";
import { TRIP_TYPE_LABELS } from "@/lib/types";
import { cn, countdownLabel, tripCountdown } from "@/lib/utils";
import { AppShell, PageContainer } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared";
import { Map } from "lucide-react";

export function useTripBundle(db: DB, tripId: string): TripBundle | null {
  const trip = getTrip(db, tripId);
  if (!trip) return null;
  return {
    trip,
    budgetItems: tripBudget(db, tripId),
    packingItems: tripPacking(db, tripId),
    itineraryItems: tripItinerary(db, tripId),
    travelTasks: tripTasks(db, tripId),
  };
}

const TABS = [
  { slug: "", label: "Overview" },
  { slug: "/itinerary", label: "Itinerary" },
  { slug: "/budget", label: "Budget" },
  { slug: "/packing", label: "Packing" },
  { slug: "/tasks", label: "Tasks" },
];

export function TripShell({
  tripId,
  active,
  children,
}: {
  tripId: string;
  active: string; // "" | "/itinerary" | ...
  children: (bundle: TripBundle, db: DB) => React.ReactNode;
}) {
  const db = useDB();
  const router = useRouter();
  const bundle = useTripBundle(db, tripId);

  if (!bundle) {
    return (
      <AppShell>
        <PageContainer>
          <EmptyState
            icon={Map}
            title="Trip not found"
            description="This trip may have been deleted, or your demo data was reset."
            action={
              <Link href="/dashboard">
                <Button>Back to dashboard</Button>
              </Link>
            }
          />
        </PageContainer>
      </AppShell>
    );
  }

  const { trip } = bundle;
  const countdown = tripCountdown(trip.startDate, trip.endDate);

  return (
    <AppShell>
      <PageContainer>
        {/* Trip header */}
        <div className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">
                  {trip.name}
                </h1>
                <Badge variant="blue">{TRIP_TYPE_LABELS[trip.tripType]}</Badge>
                {trip.isFestivalMode && (
                  <Badge variant="neon">
                    <PartyPopper className="size-3" /> Festival Mode
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {trip.origin ? `${trip.origin} → ` : ""}
                  {trip.destination || "Destination TBD"}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-ocean-700">
                  <Timer className="size-4" />
                  {countdownLabel(countdown)}
                </span>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Delete "${trip.name}" and all its data?`)) {
                  deleteTrip(trip.id);
                  router.push("/dashboard");
                }
              }}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>

          {/* Dates */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="h-9 w-auto"
              value={trip.startDate ?? ""}
              onChange={(e) => updateTrip(trip.id, { startDate: e.target.value || null })}
              aria-label="Trip start date"
            />
            <span className="text-charcoal-400">→</span>
            <Input
              type="date"
              className="h-9 w-auto"
              value={trip.endDate ?? ""}
              onChange={(e) => updateTrip(trip.id, { endDate: e.target.value || null })}
              aria-label="Trip end date"
            />
          </div>
        </div>

        {/* Tabs */}
        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-sand-200 bg-white p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.slug}
              href={`/trips/${trip.id}${tab.slug}`}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active === tab.slug
                  ? "bg-ocean-700 text-white"
                  : "text-charcoal-500 hover:bg-sand-100 hover:text-charcoal-900"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {children(bundle, db)}
      </PageContainer>
    </AppShell>
  );
}
