"use client";

import { use, useState } from "react";
import { AlertTriangle, CalendarClock, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  addItineraryItem,
  deleteItineraryItem,
  updateItineraryItem,
} from "@/lib/store";
import {
  ITINERARY_CATEGORY_LABELS,
  type ItineraryCategory,
  type ItineraryItem,
} from "@/lib/types";
import {
  formatMoney,
  formatShortDate,
  formatTime,
  timeToMinutes,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/shared";
import { TripShell } from "@/components/trip-shell";

type Draft = {
  title: string;
  itemDate: string;
  startTime: string;
  endTime: string;
  location: string;
  category: ItineraryCategory;
  estimatedCost: string;
  notes: string;
  reservationStatus: ItineraryItem["reservationStatus"];
};

const EMPTY_DRAFT: Draft = {
  title: "",
  itemDate: "",
  startTime: "",
  endTime: "",
  location: "",
  category: "activity",
  estimatedCost: "",
  notes: "",
  reservationStatus: "not_needed",
};

function draftFrom(item: ItineraryItem): Draft {
  return {
    title: item.title,
    itemDate: item.itemDate ?? "",
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    location: item.location,
    category: item.category,
    estimatedCost: item.estimatedCost ? String(item.estimatedCost) : "",
    notes: item.notes,
    reservationStatus: item.reservationStatus,
  };
}

function ItineraryForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  saveLabel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  return (
    <Card className="border-ocean-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="it-title">Title</Label>
          <Input
            id="it-title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Dinner at the night market"
          />
        </div>
        <div>
          <Label htmlFor="it-date">Date</Label>
          <Input
            id="it-date"
            type="date"
            value={draft.itemDate}
            onChange={(e) => setDraft({ ...draft, itemDate: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="it-start">Start</Label>
            <Input
              id="it-start"
              type="time"
              value={draft.startTime}
              onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="it-end">End</Label>
            <Input
              id="it-end"
              type="time"
              value={draft.endTime}
              onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="it-location">Location</Label>
          <Input
            id="it-location"
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="it-category">Category</Label>
          <Select
            id="it-category"
            value={draft.category}
            onChange={(e) =>
              setDraft({ ...draft, category: e.target.value as ItineraryCategory })
            }
          >
            {Object.entries(ITINERARY_CATEGORY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="it-cost">Estimated cost ($)</Label>
          <Input
            id="it-cost"
            type="number"
            min={0}
            value={draft.estimatedCost}
            onChange={(e) => setDraft({ ...draft, estimatedCost: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="it-reservation">Reservation</Label>
          <Select
            id="it-reservation"
            value={draft.reservationStatus}
            onChange={(e) =>
              setDraft({
                ...draft,
                reservationStatus: e.target.value as Draft["reservationStatus"],
              })
            }
          >
            <option value="not_needed">Not needed</option>
            <option value="needed">Needed</option>
            <option value="booked">Booked</option>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="it-notes">Notes</Label>
          <Textarea
            id="it-notes"
            className="min-h-14"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          <X className="size-4" /> Cancel
        </Button>
        <Button onClick={onSave} disabled={!draft.title.trim()}>
          {saveLabel}
        </Button>
      </div>
    </Card>
  );
}

export default function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  function saveDraft() {
    const payload = {
      tripId,
      title: draft.title.trim(),
      itemDate: draft.itemDate || null,
      startTime: draft.startTime || null,
      endTime: draft.endTime || null,
      location: draft.location,
      category: draft.category,
      estimatedCost: Number(draft.estimatedCost) || 0,
      notes: draft.notes,
      reservationStatus: draft.reservationStatus,
    };
    if (editingId) {
      updateItineraryItem(editingId, payload);
    } else {
      addItineraryItem(payload);
    }
    setAdding(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  return (
    <TripShell tripId={tripId} active="/itinerary">
      {(bundle) => {
        const items = bundle.itineraryItems;
        const byDay = new Map<string, ItineraryItem[]>();
        for (const item of items) {
          const key = item.itemDate ?? "unscheduled";
          byDay.set(key, [...(byDay.get(key) ?? []), item]);
        }

        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Itinerary{" "}
                <span className="text-sm font-normal text-charcoal-400">
                  ({items.length} items)
                </span>
              </h2>
              {!adding && !editingId && (
                <Button
                  onClick={() => {
                    setDraft({
                      ...EMPTY_DRAFT,
                      itemDate: bundle.trip.startDate ?? "",
                    });
                    setAdding(true);
                  }}
                >
                  <Plus className="size-4" /> Add item
                </Button>
              )}
            </div>

            {adding && (
              <ItineraryForm
                draft={draft}
                setDraft={setDraft}
                onSave={saveDraft}
                onCancel={() => {
                  setAdding(false);
                  setDraft(EMPTY_DRAFT);
                }}
                saveLabel="Add to itinerary"
              />
            )}

            {items.length === 0 && !adding ? (
              <EmptyState
                icon={CalendarClock}
                title="No itinerary yet"
                description="Add your first item — flights, dinners, sets, anything with a time."
              />
            ) : (
              [...byDay.entries()].map(([day, dayItems]) => (
                <div key={day}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
                    {day === "unscheduled" ? "Unscheduled" : formatShortDate(day)}
                  </h3>
                  <div className="space-y-2">
                    {dayItems.map((item, idx) => {
                      // Flag tight timing: < 30 min between this and the previous item.
                      const prev = idx > 0 ? dayItems[idx - 1] : null;
                      const prevEnd = prev
                        ? timeToMinutes(prev.endTime) ?? timeToMinutes(prev.startTime)
                        : null;
                      const thisStart = timeToMinutes(item.startTime);
                      const tight =
                        prevEnd !== null &&
                        thisStart !== null &&
                        thisStart - prevEnd >= 0 &&
                        thisStart - prevEnd < 30;

                      if (editingId === item.id) {
                        return (
                          <ItineraryForm
                            key={item.id}
                            draft={draft}
                            setDraft={setDraft}
                            onSave={saveDraft}
                            onCancel={() => {
                              setEditingId(null);
                              setDraft(EMPTY_DRAFT);
                            }}
                            saveLabel="Save changes"
                          />
                        );
                      }

                      return (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-charcoal-900">{item.title}</p>
                                <Badge variant="outline">
                                  {ITINERARY_CATEGORY_LABELS[item.category]}
                                </Badge>
                                {item.reservationStatus === "needed" && (
                                  <Badge variant="amber">Reservation needed</Badge>
                                )}
                                {item.reservationStatus === "booked" && (
                                  <Badge variant="green">Booked</Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-charcoal-500">
                                {item.startTime && formatTime(item.startTime)}
                                {item.endTime && ` – ${formatTime(item.endTime)}`}
                                {item.location && (
                                  <span className="ml-2 inline-flex items-center gap-1">
                                    <MapPin className="size-3.5" /> {item.location}
                                  </span>
                                )}
                                {item.estimatedCost > 0 && (
                                  <span className="ml-2">
                                    · {formatMoney(item.estimatedCost)}
                                  </span>
                                )}
                              </p>
                              {item.notes && (
                                <p className="mt-1 text-sm text-charcoal-400">{item.notes}</p>
                              )}
                              {tight && (
                                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                  <AlertTriangle className="size-3.5" />
                                  Tight timing — less than 30 minutes after the previous item.
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Edit item"
                                onClick={() => {
                                  setAdding(false);
                                  setEditingId(item.id);
                                  setDraft(draftFrom(item));
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                aria-label="Delete item"
                                onClick={() => deleteItineraryItem(item.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      }}
    </TripShell>
  );
}
