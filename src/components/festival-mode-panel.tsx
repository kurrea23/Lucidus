"use client";

import { PartyPopper } from "lucide-react";
import type { TripBundle } from "@/lib/readiness";
import { upsertFestivalDetails } from "@/lib/store";
import type { FestivalDetails } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const TICKET_LABELS: Record<FestivalDetails["ticketStatus"], string> = {
  not_added: "Not added",
  need_tickets: "Need tickets",
  have_tickets: "Have tickets",
  wristband_registered: "Wristband registered",
};

export function FestivalModePanel({
  bundle,
  festival,
}: {
  bundle: TripBundle;
  festival: FestivalDetails | undefined;
}) {
  const tripId = bundle.trip.id;
  const f: FestivalDetails = festival ?? {
    id: "",
    tripId,
    festivalName: bundle.trip.festivalName ?? "",
    ticketStatus: "not_added",
    lodgingType: "",
    venueTransportation: "",
    meetupSpot: "",
    afterpartyPlan: "",
    recoveryPlan: "",
  };

  const festivalTasks = bundle.travelTasks
    .filter((t) => t.category === "festival" && !t.isDone)
    .slice(0, 4);

  return (
    <Card className="border-neon-300 bg-gradient-to-b from-neon-100/60 to-white">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="size-4 text-neon-600" />
          Festival Mode
        </CardTitle>
        <Badge variant="neon">{f.festivalName || "Festival"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fest-ticket">Ticket status</Label>
            <Select
              id="fest-ticket"
              value={f.ticketStatus}
              onChange={(e) =>
                upsertFestivalDetails(tripId, {
                  festivalName: f.festivalName,
                  ticketStatus: e.target.value as FestivalDetails["ticketStatus"],
                })
              }
            >
              {Object.entries(TICKET_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="fest-lodging">Lodging</Label>
            <Input
              id="fest-lodging"
              placeholder="Hotel, Airbnb, camping…"
              defaultValue={f.lodgingType}
              onBlur={(e) =>
                upsertFestivalDetails(tripId, {
                  festivalName: f.festivalName,
                  lodgingType: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="fest-transport">Transportation to venue</Label>
            <Input
              id="fest-transport"
              placeholder="Shuttle, rideshare, walk…"
              defaultValue={f.venueTransportation}
              onBlur={(e) =>
                upsertFestivalDetails(tripId, {
                  festivalName: f.festivalName,
                  venueTransportation: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="fest-meetup">Meetup spot</Label>
            <Input
              id="fest-meetup"
              placeholder="Where do friends regroup?"
              defaultValue={f.meetupSpot}
              onBlur={(e) =>
                upsertFestivalDetails(tripId, {
                  festivalName: f.festivalName,
                  meetupSpot: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="fest-afterparty">Afterparty plan</Label>
            <Input
              id="fest-afterparty"
              placeholder="Where to after the last set?"
              defaultValue={f.afterpartyPlan}
              onBlur={(e) =>
                upsertFestivalDetails(tripId, {
                  festivalName: f.festivalName,
                  afterpartyPlan: e.target.value,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="fest-recovery">Recovery plan</Label>
            <Textarea
              id="fest-recovery"
              className="min-h-10"
              placeholder="Hydration, electrolytes, sleep-in day…"
              defaultValue={f.recoveryPlan}
              onBlur={(e) =>
                upsertFestivalDetails(tripId, {
                  festivalName: f.festivalName,
                  recoveryPlan: e.target.value,
                })
              }
            />
          </div>
        </div>

        {festivalTasks.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
              Top festival tasks
            </p>
            <ul className="space-y-1.5">
              {festivalTasks.map((t) => (
                <li key={t.id} className="text-sm text-charcoal-700">
                  • {t.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
