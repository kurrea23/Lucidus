import { useSyncExternalStore } from "react";
import { mockTripPlanner } from "./ai-trip-planner";
import type {
  BudgetItem,
  FestivalDetails,
  GeneratedTripPlan,
  ItineraryItem,
  PackingItem,
  TravelProfile,
  TravelTask,
  Trip,
  TripInterviewInput,
  UserProfile,
} from "./types";
import { addDays, todayISO, uid } from "./utils";

/**
 * TripCooker local demo mode store.
 *
 * All data lives in localStorage under a single key. The shape mirrors the
 * Supabase schema in supabase/schema.sql so the storage layer can be swapped
 * for real auth + Postgres without touching the UI.
 */

export type DB = {
  user: UserProfile;
  travelProfile: TravelProfile | null;
  trips: Trip[];
  itineraryItems: ItineraryItem[];
  budgetItems: BudgetItem[];
  packingItems: PackingItem[];
  travelTasks: TravelTask[];
  festivalDetails: FestivalDetails[];
};

const STORAGE_KEY = "tripcooker:v1";

function defaultUser(): UserProfile {
  return {
    id: "local-user",
    email: "",
    displayName: "Traveler",
    plan: "free",
    createdAt: new Date().toISOString(),
  };
}

function emptyDB(): DB {
  return {
    user: defaultUser(),
    travelProfile: null,
    trips: [],
    itineraryItems: [],
    budgetItems: [],
    packingItems: [],
    travelTasks: [],
    festivalDetails: [],
  };
}

const SERVER_DB: DB = {
  user: {
    id: "local-user",
    email: "",
    displayName: "Traveler",
    plan: "free",
    createdAt: "",
  },
  travelProfile: null,
  trips: [],
  itineraryItems: [],
  budgetItems: [],
  packingItems: [],
  travelTasks: [],
  festivalDetails: [],
};

let cache: DB | null = null;
const listeners = new Set<() => void>();

function readDB(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...emptyDB(), ...(JSON.parse(raw) as DB) } : emptyDB();
  } catch {
    cache = emptyDB();
  }
  return cache;
}

function writeDB(db: DB) {
  cache = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // localStorage unavailable (private mode etc.) — keep in-memory state.
  }
  listeners.forEach((l) => l());
}

function mutate(fn: (db: DB) => DB) {
  writeDB(fn(readDB()));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, readDB, () => SERVER_DB);
}

/* ------------------------------ Selectors ------------------------------ */

export function activeTrips(db: DB): Trip[] {
  return db.trips.filter((t) => t.status === "planning" || t.status === "ready");
}

export function canCreateTrip(db: DB): boolean {
  return db.user.plan === "premium" || activeTrips(db).length < 1;
}

export function getTrip(db: DB, tripId: string): Trip | undefined {
  return db.trips.find((t) => t.id === tripId);
}

export function tripItinerary(db: DB, tripId: string): ItineraryItem[] {
  return db.itineraryItems
    .filter((i) => i.tripId === tripId)
    .sort((a, b) =>
      `${a.itemDate ?? "9999"}T${a.startTime ?? "99:99"}`.localeCompare(
        `${b.itemDate ?? "9999"}T${b.startTime ?? "99:99"}`
      )
    );
}

export function tripBudget(db: DB, tripId: string): BudgetItem[] {
  return db.budgetItems.filter((i) => i.tripId === tripId);
}

export function tripPacking(db: DB, tripId: string): PackingItem[] {
  return db.packingItems.filter((i) => i.tripId === tripId);
}

export function tripTasks(db: DB, tripId: string): TravelTask[] {
  return db.travelTasks.filter((i) => i.tripId === tripId);
}

export function tripFestival(db: DB, tripId: string): FestivalDetails | undefined {
  return db.festivalDetails.find((f) => f.tripId === tripId);
}

/* ------------------------------ Mutations ------------------------------ */

export function updateUser(patch: Partial<UserProfile>) {
  mutate((db) => ({ ...db, user: { ...db.user, ...patch } }));
}

export function saveTravelProfile(dna: GeneratedTripPlan["travelDNA"]) {
  mutate((db) => ({
    ...db,
    travelProfile: {
      id: db.travelProfile?.id ?? uid(),
      travelerType: dna.travelerType,
      budgetStyle: dna.budgetStyle,
      pace: dna.pace,
      foodStyle: dna.foodStyle,
      transportStyle: dna.transportStyle,
      planningMode: dna.planningMode,
      stressPoints: dna.stressPoints,
      preferredExperiences: dna.preferredExperiences,
      createdAt: db.travelProfile?.createdAt ?? new Date().toISOString(),
    },
  }));
}

export function createTripFromPlan(
  input: TripInterviewInput,
  plan: GeneratedTripPlan
): string {
  const tripId = uid();
  const now = new Date().toISOString();

  const trip: Trip = {
    id: tripId,
    name: plan.tripName,
    tripType: input.tripType,
    destination: input.destination,
    origin: input.origin,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    isFestivalMode: input.isFestivalMode,
    festivalName: input.festivalName,
    status: "planning",
    targetBudget: input.budget,
    amountSaved: 0,
    travelerCount: input.travelerCount,
    notes: "",
    createdAt: now,
  };

  const budgetItems: BudgetItem[] = plan.budgetItems.map((b) => ({
    id: uid(),
    tripId,
    category: b.category,
    label: b.label,
    estimatedAmount: b.estimatedAmount,
    paidAmount: 0,
    notes: "",
    createdAt: now,
  }));

  const packingItems: PackingItem[] = plan.packingItems.map((p) => ({
    id: uid(),
    tripId,
    label: p.label,
    category: p.category,
    isPacked: false,
    quantity: p.quantity ?? 1,
    notes: "",
    createdAt: now,
  }));

  const travelTasks: TravelTask[] = plan.travelTasks.map((t) => ({
    id: uid(),
    tripId,
    title: t.title,
    category: t.category,
    priority: t.priority,
    dueDate: null,
    isDone: false,
    notes: "",
    createdAt: now,
  }));

  const itineraryItems: ItineraryItem[] = plan.itineraryItems.map((i) => ({
    id: uid(),
    tripId,
    title: i.title,
    itemDate: i.itemDate || null,
    startTime: i.startTime ?? null,
    endTime: i.endTime ?? null,
    location: i.location ?? "",
    category: i.category,
    estimatedCost: i.estimatedCost ?? 0,
    notes: i.notes ?? "",
    reservationStatus: "not_needed",
    createdAt: now,
  }));

  const festivalDetails: FestivalDetails[] = plan.festivalDetails
    ? [
        {
          id: uid(),
          tripId,
          festivalName: plan.festivalDetails.festivalName,
          ticketStatus:
            (plan.festivalDetails.ticketStatus as FestivalDetails["ticketStatus"]) ??
            "not_added",
          lodgingType: plan.festivalDetails.lodgingType,
          venueTransportation: plan.festivalDetails.venueTransportation,
          meetupSpot: plan.festivalDetails.meetupSpot,
          afterpartyPlan: plan.festivalDetails.afterpartyPlan,
          recoveryPlan: plan.festivalDetails.recoveryPlan,
        },
      ]
    : [];

  mutate((db) => ({
    ...db,
    trips: [...db.trips, trip],
    budgetItems: [...db.budgetItems, ...budgetItems],
    packingItems: [...db.packingItems, ...packingItems],
    travelTasks: [...db.travelTasks, ...travelTasks],
    itineraryItems: [...db.itineraryItems, ...itineraryItems],
    festivalDetails: [...db.festivalDetails, ...festivalDetails],
  }));

  return tripId;
}

export function updateTrip(tripId: string, patch: Partial<Trip>) {
  mutate((db) => ({
    ...db,
    trips: db.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)),
  }));
}

export function deleteTrip(tripId: string) {
  mutate((db) => ({
    ...db,
    trips: db.trips.filter((t) => t.id !== tripId),
    itineraryItems: db.itineraryItems.filter((i) => i.tripId !== tripId),
    budgetItems: db.budgetItems.filter((i) => i.tripId !== tripId),
    packingItems: db.packingItems.filter((i) => i.tripId !== tripId),
    travelTasks: db.travelTasks.filter((i) => i.tripId !== tripId),
    festivalDetails: db.festivalDetails.filter((f) => f.tripId !== tripId),
  }));
}

/* Itinerary */

export function addItineraryItem(item: Omit<ItineraryItem, "id" | "createdAt">) {
  mutate((db) => ({
    ...db,
    itineraryItems: [
      ...db.itineraryItems,
      { ...item, id: uid(), createdAt: new Date().toISOString() },
    ],
  }));
}

export function updateItineraryItem(id: string, patch: Partial<ItineraryItem>) {
  mutate((db) => ({
    ...db,
    itineraryItems: db.itineraryItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  }));
}

export function deleteItineraryItem(id: string) {
  mutate((db) => ({
    ...db,
    itineraryItems: db.itineraryItems.filter((i) => i.id !== id),
  }));
}

/* Budget */

export function addBudgetItem(item: Omit<BudgetItem, "id" | "createdAt">) {
  mutate((db) => ({
    ...db,
    budgetItems: [
      ...db.budgetItems,
      { ...item, id: uid(), createdAt: new Date().toISOString() },
    ],
  }));
}

export function updateBudgetItem(id: string, patch: Partial<BudgetItem>) {
  mutate((db) => ({
    ...db,
    budgetItems: db.budgetItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
  }));
}

export function deleteBudgetItem(id: string) {
  mutate((db) => ({
    ...db,
    budgetItems: db.budgetItems.filter((i) => i.id !== id),
  }));
}

/* Packing */

export function addPackingItem(item: Omit<PackingItem, "id" | "createdAt">) {
  mutate((db) => ({
    ...db,
    packingItems: [
      ...db.packingItems,
      { ...item, id: uid(), createdAt: new Date().toISOString() },
    ],
  }));
}

export function togglePackingItem(id: string) {
  mutate((db) => ({
    ...db,
    packingItems: db.packingItems.map((i) =>
      i.id === id ? { ...i, isPacked: !i.isPacked } : i
    ),
  }));
}

export function deletePackingItem(id: string) {
  mutate((db) => ({
    ...db,
    packingItems: db.packingItems.filter((i) => i.id !== id),
  }));
}

/* Tasks */

export function addTravelTask(item: Omit<TravelTask, "id" | "createdAt">) {
  mutate((db) => ({
    ...db,
    travelTasks: [
      ...db.travelTasks,
      { ...item, id: uid(), createdAt: new Date().toISOString() },
    ],
  }));
}

export function toggleTravelTask(id: string) {
  mutate((db) => ({
    ...db,
    travelTasks: db.travelTasks.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t)),
  }));
}

export function deleteTravelTask(id: string) {
  mutate((db) => ({
    ...db,
    travelTasks: db.travelTasks.filter((t) => t.id !== id),
  }));
}

/* Festival details */

export function upsertFestivalDetails(tripId: string, patch: Partial<FestivalDetails>) {
  mutate((db) => {
    const existing = db.festivalDetails.find((f) => f.tripId === tripId);
    if (existing) {
      return {
        ...db,
        festivalDetails: db.festivalDetails.map((f) =>
          f.tripId === tripId ? { ...f, ...patch } : f
        ),
      };
    }
    return {
      ...db,
      festivalDetails: [
        ...db.festivalDetails,
        {
          id: uid(),
          tripId,
          festivalName: "",
          ticketStatus: "not_added",
          lodgingType: "",
          venueTransportation: "",
          meetupSpot: "",
          afterpartyPlan: "",
          recoveryPlan: "",
          ...patch,
        },
      ],
    };
  });
}

export function resetAll() {
  writeDB(emptyDB());
}

/* ------------------------------ Demo data ------------------------------ */

/** Seed a sample festival trip so the demo dashboard feels alive. Returns the trip id. */
export function seedDemoTrip(): string {
  const start = addDays(todayISO(), 45);
  const end = addDays(start, 3);
  const input: TripInterviewInput = {
    origin: "Los Angeles, CA",
    destination: "Las Vegas, NV",
    startDate: start,
    endDate: end,
    tripType: "festival",
    budget: 1800,
    travelerCount: 4,
    travelStyle: ["Party", "Balanced"],
    pace: "balanced",
    foodStyle: "late_night",
    transportStyle: "shuttle",
    stressPoints: ["Being late", "Packing", "Budget"],
    isFestivalMode: true,
    festivalName: "EDC Las Vegas",
    isInternational: false,
    lodgingStyle: "group_house",
    priorities: ["Best value", "Nightlife", "Convenience"],
    festival: {
      hasTickets: true,
      lodgingType: "Airbnb with friends",
      wantsSetPlanning: true,
      wantsOutfitPlanning: true,
      wantsHydrationReminders: true,
      wantsAfterpartyPlanning: true,
      wantsMeetupPlanning: true,
    },
  };

  const plan = mockTripPlanner(input);
  saveTravelProfile(plan.travelDNA);
  const tripId = createTripFromPlan(input, plan);

  // Make the demo feel mid-planning: some progress, not everything done.
  updateTrip(tripId, {
    amountSaved: 750,
    notes: "Emergency contact: Sam (sister) — 555-0142. Meet at the Ferris wheel if separated.",
  });
  const db = readDB();
  const tasks = tripTasks(db, tripId);
  for (const t of tasks) {
    if (/Register festival wristband|Book lodging/.test(t.title)) toggleTravelTask(t.id);
  }
  const lodging = tripBudget(readDB(), tripId).find((b) => b.category === "lodging");
  if (lodging) updateBudgetItem(lodging.id, { paidAmount: lodging.estimatedAmount });
  const packing = tripPacking(readDB(), tripId);
  for (const p of packing.slice(0, 3)) togglePackingItem(p.id);

  return tripId;
}
