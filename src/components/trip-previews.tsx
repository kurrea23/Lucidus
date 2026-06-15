import { CalendarClock, ListChecks, Luggage } from "lucide-react";
import type { TripBundle } from "@/lib/readiness";
import { ITINERARY_CATEGORY_LABELS } from "@/lib/types";
import { formatShortDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { SectionLink } from "@/components/shared";

export function ItineraryPreview({ bundle }: { bundle: TripBundle }) {
  const items = bundle.itineraryItems.slice(0, 4);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4 text-ocean-600" />
          Itinerary
        </CardTitle>
        <SectionLink href={`/trips/${bundle.trip.id}/itinerary`}>Open itinerary</SectionLink>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-charcoal-500">No itinerary items yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-charcoal-900">{i.title}</p>
                  <p className="text-xs text-charcoal-400">
                    {formatShortDate(i.itemDate)}
                    {i.startTime ? ` · ${formatTime(i.startTime)}` : ""}
                  </p>
                </div>
                <Badge variant="outline">{ITINERARY_CATEGORY_LABELS[i.category]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PackingPreview({ bundle }: { bundle: TripBundle }) {
  const { packingItems } = bundle;
  const packed = packingItems.filter((p) => p.isPacked).length;
  const pct = packingItems.length > 0 ? (packed / packingItems.length) * 100 : 0;
  const top = packingItems.filter((p) => !p.isPacked).slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Luggage className="size-4 text-ocean-600" />
          Packing
        </CardTitle>
        <SectionLink href={`/trips/${bundle.trip.id}/packing`}>Open packing</SectionLink>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-3">
          <ProgressBar value={pct} className="h-1.5" />
          <span className="shrink-0 text-xs font-medium text-charcoal-700">
            {Math.round(pct)}% packed
          </span>
        </div>
        {top.length === 0 ? (
          <p className="text-sm text-charcoal-500">
            {packingItems.length === 0 ? "No packing items yet." : "Everything is packed."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {top.map((p) => (
              <li key={p.id} className="text-sm text-charcoal-700">
                • {p.label}
                {p.quantity > 1 ? ` ×${p.quantity}` : ""}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TaskPreview({ bundle }: { bundle: TripBundle }) {
  const open = bundle.travelTasks
    .filter((t) => !t.isDone)
    .sort((a, b) => {
      const order = { high: 0, normal: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-ocean-600" />
          Travel Tasks
        </CardTitle>
        <SectionLink href={`/trips/${bundle.trip.id}/tasks`}>Open tasks</SectionLink>
      </CardHeader>
      <CardContent>
        {open.length === 0 ? (
          <p className="text-sm text-charcoal-500">
            {bundle.travelTasks.length === 0 ? "No tasks yet." : "All tasks done. 🎉"}
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm text-charcoal-700">{t.title}</span>
                {t.priority === "high" && <Badge variant="red">High</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
