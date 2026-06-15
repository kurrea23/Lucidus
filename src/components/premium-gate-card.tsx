import Link from "next/link";
import { CalendarDays, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MOCK_YEAR = [
  { month: "May", trip: "EDC Las Vegas" },
  { month: "July", trip: "Beach Trip" },
  { month: "September", trip: "Lost Lands" },
  { month: "November", trip: "EDSea" },
];

export function PremiumGateCard() {
  return (
    <Card className="overflow-hidden">
      <div className="bg-ocean-900 p-8 text-center text-white">
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/10">
          <Lock className="size-5" />
        </span>
        <h2 className="text-2xl font-bold">
          You cooked your first trip. Want to build your whole travel year?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ocean-200">
          Free plans include one active trip. TripCooker Premium unlocks unlimited
          trips, your yearly travel calendar, and annual budget tracking.
        </p>
        <Link href="/premium" className="mt-5 inline-block">
          <Button size="lg" className="bg-white text-ocean-900 hover:bg-sand-100">
            <Crown className="size-4" />
            Unlock Travel Season Pro
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        {MOCK_YEAR.map((m) => (
          <div
            key={m.month}
            className="rounded-xl border border-dashed border-sand-300 bg-sand-50 p-3 text-center"
          >
            <p className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
              <CalendarDays className="size-3" /> {m.month}
            </p>
            <p className="mt-1 text-sm font-medium text-charcoal-700">{m.trip}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
