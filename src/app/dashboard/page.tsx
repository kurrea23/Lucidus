"use client";

import Link from "next/link";
import { ChefHat, Map, Plus } from "lucide-react";
import {
  activeTrips,
  canCreateTrip,
  tripBudget,
  tripItinerary,
  tripPacking,
  tripTasks,
  useDB,
} from "@/lib/store";
import { AppShell, PageContainer, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { PremiumGateCard } from "@/components/premium-gate-card";
import { TravelDNACard } from "@/components/travel-dna-card";
import { TripCard } from "@/components/trip-card";

export default function DashboardPage() {
  const db = useDB();
  const trips = activeTrips(db);

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={`Welcome back, ${db.user.displayName || "Traveler"}`}
          description={
            trips.length === 0
              ? "Let's cook your first trip."
              : "Here's where your trips stand."
          }
          actions={
            canCreateTrip(db) ? (
              <Link href="/trips/new">
                <Button>
                  <Plus className="size-4" /> New Trip
                </Button>
              </Link>
            ) : (
              <Link href="/premium">
                <Button variant="outline">
                  <Plus className="size-4" /> New Trip
                </Button>
              </Link>
            )
          }
        />

        {trips.length === 0 ? (
          <EmptyState
            icon={Map}
            title="No trips on the stove yet"
            description="Answer the travel interview and TripCooker will cook your itinerary, budget, packing list, and tasks."
            action={
              <Link href="/onboarding">
                <Button>
                  <ChefHat className="size-4" /> Start Cooking a Trip
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  bundle={{
                    trip,
                    budgetItems: tripBudget(db, trip.id),
                    packingItems: tripPacking(db, trip.id),
                    itineraryItems: tripItinerary(db, trip.id),
                    travelTasks: tripTasks(db, trip.id),
                  }}
                />
              ))}
              {!canCreateTrip(db) && <PremiumGateCard />}
            </div>
            <div className="space-y-4">
              {db.travelProfile && <TravelDNACard profile={db.travelProfile} />}
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
