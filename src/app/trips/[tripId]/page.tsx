"use client";

import { use } from "react";
import { NotebookPen } from "lucide-react";
import { tripFestival, updateTrip } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { FestivalModePanel } from "@/components/festival-mode-panel";
import {
  BudgetSnapshotCard,
  NextActionCard,
  ReadinessScoreCard,
} from "@/components/trip-dashboard-cards";
import { ItineraryPreview, PackingPreview, TaskPreview } from "@/components/trip-previews";
import { TripShell } from "@/components/trip-shell";

export default function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);

  return (
    <TripShell tripId={tripId} active="">
      {(bundle, db) => (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <ReadinessScoreCard bundle={bundle} />
            <NextActionCard bundle={bundle} />
            <BudgetSnapshotCard bundle={bundle} />
            {bundle.trip.isFestivalMode && (
              <FestivalModePanel bundle={bundle} festival={tripFestival(db, tripId)} />
            )}
            <ItineraryPreview bundle={bundle} />
          </div>
          <div className="space-y-4">
            <TaskPreview bundle={bundle} />
            <PackingPreview bundle={bundle} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NotebookPen className="size-4 text-ocean-600" />
                  Trip Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Emergency contacts, addresses, reminders…"
                  defaultValue={bundle.trip.notes}
                  onBlur={(e) => updateTrip(tripId, { notes: e.target.value })}
                  className="min-h-28"
                />
                <p className="mt-1.5 text-xs text-charcoal-400">
                  Tip: mention an emergency contact here for +10 readiness.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </TripShell>
  );
}
