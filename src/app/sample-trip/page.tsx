import Link from "next/link";
import { mockTripPlanner } from "@/lib/ai-trip-planner";
import { formatMoney } from "@/lib/utils";
const sample = mockTripPlanner({
  origin: "Phoenix",
  destination: "San Diego",
  startDate: "2027-04-02",
  endDate: "2027-04-05",
  tripType: "vacation",
  budget: 1200,
  travelerCount: 1,
  travelStyle: ["Food", "Beach"],
  pace: "balanced",
  foodStyle: "local_gems",
  transportStyle: "walking",
  stressPoints: ["Overspending"],
  isFestivalMode: false,
});
export default function SampleTrip() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="font-bold text-ocean-700">
        TripCooker
      </Link>
      <h1 className="mt-6 text-3xl font-bold">A sample cooked trip</h1>
      <p className="mt-3 text-charcoal-500">
        Illustrative plan · not a booking or current price quote. Your interview
        creates an editable starter plan like this.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="text-xl font-semibold">{sample.tripName}</h2>
          <p className="mt-2">{sample.travelDNA.travelerType}</p>
          <h3 className="mt-4 font-semibold">Estimated budget</h3>
          <ul className="mt-3 space-y-2">
            {sample.budgetItems.map((b) => (
              <li key={b.category} className="flex justify-between gap-4">
                <span>{b.label}</span>
                <span>{formatMoney(b.estimatedAmount)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="text-xl font-semibold">
            Day-by-day starter itinerary
          </h2>
          <ul className="mt-3 space-y-3">
            {sample.itineraryItems.slice(0, 8).map((i, n) => (
              <li key={n}>
                <span className="text-sm text-charcoal-400">
                  {i.itemDate} {i.startTime}
                </span>
                <p>{i.title}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-sand-200 bg-white p-6">
        <h2 className="font-semibold">Packing & tasks</h2>
        <p className="mt-2">
          {sample.packingItems.length} packing suggestions and{" "}
          {sample.travelTasks.length} travel tasks give your planning a starting
          point.
        </p>
      </section>
      <Link
        href="/onboarding"
        className="mt-6 inline-block rounded-lg bg-ocean-700 px-5 py-3 font-semibold text-white"
      >
        Cook my free trip
      </Link>
    </main>
  );
}
