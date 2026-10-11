import test from "node:test";
import assert from "node:assert/strict";
import { mockTripPlanner } from "../src/lib/ai-trip-planner";
import { emptyDatabase } from "../src/lib/database";
import { databaseSchema, interviewProblem } from "../src/lib/validation";
import { tripsForYear } from "../src/lib/calendar";
import { SaveError, SyncQueue } from "../src/lib/sync-queue";
import type { TripInterviewInput } from "../src/lib/types";
const input: TripInterviewInput = {
  origin: "Phoenix",
  destination: "San Diego",
  startDate: "2027-04-02",
  endDate: "2027-04-05",
  tripType: "vacation",
  budget: 1200,
  travelerCount: 1,
  travelStyle: ["Beach"],
  pace: "balanced",
  foodStyle: "local_gems",
  transportStyle: "walking",
  stressPoints: [],
  isFestivalMode: false,
};
test("all trip types generate valid finite budgets, dated itinerary, and packing", () => {
  for (const tripType of [
    "vacation",
    "festival",
    "business",
    "road_trip",
    "adventure",
    "wellness",
    "romantic",
    "family",
    "budget",
    "luxury",
    "solo",
  ] as const) {
    const p = mockTripPlanner({
      ...input,
      tripType,
      isFestivalMode: tripType === "festival",
      festivalName: "Sample Festival",
    });
    assert.ok(
      p.budgetItems.reduce((s, i) => s + i.estimatedAmount, 0) <= input.budget,
    );
    assert.ok(
      p.budgetItems.every(
        (i) => Number.isFinite(i.estimatedAmount) && i.estimatedAmount >= 0,
      ),
    );
    assert.ok(
      p.itineraryItems.every(
        (i) => i.itemDate >= input.startDate && i.itemDate <= input.endDate,
      ),
    );
    assert.ok(p.packingItems.length >= 5);
    assert.ok(p.travelTasks.length >= 5);
    assert.equal(Boolean(p.festivalDetails), tripType === "festival");
  }
});
test("invalid dates, reversed dates, excessive duration and invalid budgets are rejected", () => {
  assert.equal(interviewProblem(input), "");
  for (const patch of [
    { startDate: "2027-02-30" },
    { endDate: "2027-01-01" },
    { endDate: "2030-01-01" },
    { budget: NaN },
    { budget: -1 },
    { travelerCount: 0 },
    { destination: " " },
  ])
    assert.notEqual(interviewProblem({ ...input, ...patch }), "");
});
test("snapshot validation rejects malformed, duplicate and orphaned records", () => {
  const db = emptyDatabase();
  assert.ok(databaseSchema.safeParse(db).success);
  assert.equal(
    databaseSchema.safeParse({
      ...db,
      budgetItems: [
        {
          id: "a",
          tripId: "missing",
          category: "other",
          label: "Item",
          estimatedAmount: 1,
          paidAmount: 0,
          notes: "",
          createdAt: new Date().toISOString(),
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    databaseSchema.safeParse({ ...db, unexpected: "secret" }).success,
    false,
  );
});
test("calendar excludes other years, archives and unscheduled trips", () => {
  const base = {
    id: "1",
    name: "Trip",
    tripType: "vacation" as const,
    destination: "X",
    origin: "",
    startDate: "2027-04-01",
    endDate: "2027-04-02",
    isFestivalMode: false,
    status: "planning" as const,
    targetBudget: 100,
    amountSaved: 0,
    travelerCount: 1,
    notes: "",
    createdAt: new Date().toISOString(),
  };
  const trips = [
    base,
    { ...base, id: "2", startDate: "2028-01-01" },
    { ...base, id: "3", status: "archived" as const },
    { ...base, id: "4", startDate: null },
  ];
  assert.deepEqual(
    tripsForYear(trips, "2027").map((t) => t.id),
    ["1"],
  );
});
test("save queue retains edits made during an in-flight save and increments version", async () => {
  const db = emptyDatabase();
  const later = { ...db, user: { ...db.user, displayName: "Latest" } };
  const calls: number[] = [];
  let unblock!: () => void;
  const gate = new Promise<void>((r) => (unblock = r));
  const q = new SyncQueue(
    0,
    async (data, version) => {
      calls.push(version);
      if (version === 0) await gate;
      return { version: version + 1, user: data.user };
    },
    () => {},
    () => {},
  );
  q.enqueue(db);
  q.enqueue(later);
  unblock();
  await q.flush();
  assert.deepEqual(calls, [0, 1]);
  assert.equal(q.pending, null);
  assert.equal(q.status, "saved");
});
test("save failure is retained and retryable; conflicts cannot silently overwrite data", async () => {
  const db = emptyDatabase();
  let fail = true;
  const q = new SyncQueue(
    0,
    async () => {
      if (fail) throw new SaveError(503, "Offline");
      return { version: 1, user: db.user };
    },
    () => {},
    () => {},
  );
  q.enqueue(db);
  await q.flush();
  assert.equal(q.pending, db);
  assert.equal(q.status, "error");
  fail = false;
  await q.flush();
  assert.equal(q.status, "saved");
  let calls = 0;
  const conflict = new SyncQueue(
    0,
    async () => {
      calls++;
      throw new SaveError(409, "Newer version");
    },
    () => {},
    () => {},
  );
  conflict.enqueue(db);
  await conflict.flush();
  conflict.enqueue(db);
  await conflict.flush();
  assert.equal(calls, 1);
  assert.equal(conflict.pending, db);
  assert.equal(conflict.status, "conflict");
});

test("itinerary detects overlaps, short gaps and overnight collisions", async () => {
  const { itineraryWarnings } = await import("../src/lib/itinerary-timing");
  const item = (id: string, date: string, start: string, end: string) => ({
    id,
    tripId: "t",
    title: id,
    itemDate: date,
    startTime: start,
    endTime: end,
    location: "",
    category: "activity" as const,
    estimatedCost: 0,
    notes: "",
    reservationStatus: "not_needed" as const,
    createdAt: new Date().toISOString(),
  });
  const map = itineraryWarnings([
    item("travel", "2027-04-02", "08:00", "12:00"),
    item("coffee", "2027-04-02", "08:15", "08:30"),
    item("second", "2027-04-02", "09:00", "09:15"),
    item("tight", "2027-04-02", "12:15", "13:00"),
    item("late", "2027-04-02", "23:00", "01:00"),
    item("next", "2027-04-03", "00:30", "02:00"),
  ]);
  assert.equal(map.get("coffee"), "overlap");
  assert.equal(map.get("second"), "overlap");
  assert.equal(map.get("tight"), "tight");
  assert.equal(map.get("next"), "overlap");
  assert.equal(map.has("travel"), false);
});
