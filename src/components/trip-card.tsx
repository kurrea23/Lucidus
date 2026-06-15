import Link from "next/link";
import { MapPin, PartyPopper } from "lucide-react";
import type { TripBundle } from "@/lib/readiness";
import { calculateReadinessScore } from "@/lib/readiness";
import { TRIP_TYPE_LABELS } from "@/lib/types";
import { countdownLabel, tripCountdown } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { DateRangeDisplay } from "@/components/shared";

export function TripCard({ bundle }: { bundle: TripBundle }) {
  const { trip } = bundle;
  const score = calculateReadinessScore(bundle);
  const countdown = tripCountdown(trip.startDate, trip.endDate);

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <Card className="p-5 transition-shadow group-hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-charcoal-900 truncate">{trip.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-charcoal-500">
              <MapPin className="size-3.5" />
              {trip.destination || "Destination TBD"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="blue">{TRIP_TYPE_LABELS[trip.tripType]}</Badge>
            {trip.isFestivalMode && (
              <Badge variant="neon">
                <PartyPopper className="size-3" /> Festival Mode
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <DateRangeDisplay start={trip.startDate} end={trip.endDate} />
          <span className="text-sm font-medium text-ocean-700">
            {countdownLabel(countdown)}
          </span>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-charcoal-500">
            <span>Trip readiness</span>
            <span className="font-semibold text-charcoal-700">{score}% cooked</span>
          </div>
          <ProgressBar value={score} />
        </div>
      </Card>
    </Link>
  );
}
