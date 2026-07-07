import type { User } from "@supabase/supabase-js";
import { getSupabase } from "./client";
import { fromRow, toRow } from "./mappers";
import {
  getLocalDB,
  replaceAll,
  setRemoteSink,
  updateLocalPlan,
  type DB,
  type RemoteSink,
  type RemoteTable,
} from "@/lib/store";
import type {
  BudgetItem,
  FestivalDetails,
  ItineraryItem,
  PackingItem,
  TravelProfile,
  TravelTask,
  Trip,
  UserPlan,
  UserProfile,
} from "@/lib/types";

/**
 * Cloud sync: when a user is signed in, every local mutation is mirrored to
 * Supabase (write-through), and sign-in pulls the account's data down.
 * Local demo data from before sign-up is migrated into the account on first
 * sign-in so nothing the user built is lost.
 */

let connectedUserId: string | null = null;

function logSyncError(context: string, error: unknown) {
  console.error(`[tripcooker sync] ${context}:`, error);
}

/* ------------------------------- Sink ------------------------------- */

function makeSink(userId: string): RemoteSink {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");

  return {
    upsert(table: RemoteTable, entity: unknown) {
      let row: Record<string, unknown> | null = null;
      switch (table) {
        case "trips":
          row = toRow.trips(entity as Trip, userId);
          break;
        case "itinerary_items":
          row = toRow.itinerary_items(entity as ItineraryItem);
          break;
        case "budget_items":
          row = toRow.budget_items(entity as BudgetItem);
          break;
        case "packing_items":
          row = toRow.packing_items(entity as PackingItem);
          break;
        case "travel_tasks":
          row = toRow.travel_tasks(entity as TravelTask);
          break;
        case "festival_details":
          row = toRow.festival_details(entity as FestivalDetails);
          break;
        case "travel_profiles":
          row = toRow.travel_profiles(entity as TravelProfile, userId);
          break;
        case "users": {
          // Only profile fields — `plan` is server-controlled (Stripe webhook).
          const u = entity as UserProfile;
          row = { id: userId, email: u.email, display_name: u.displayName };
          break;
        }
      }
      if (!row) return;
      void sb
        .from(table)
        .upsert(row)
        .then(({ error }) => {
          if (error) logSyncError(`upsert ${table}`, error);
        });
    },
    remove(table: RemoteTable, id: string) {
      void sb
        .from(table)
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) logSyncError(`delete ${table}`, error);
        });
    },
  };
}

/* ------------------------------- Pull ------------------------------- */

async function pullAll(userId: string, profile: CloudProfile): Promise<DB> {
  const sb = getSupabase()!;

  const [tripsRes, profileRes] = await Promise.all([
    sb.from("trips").select("*").eq("user_id", userId),
    sb
      .from("travel_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  if (tripsRes.error) throw tripsRes.error;

  const trips = (tripsRes.data ?? []).map(fromRow.trips);
  const tripIds = trips.map((t) => t.id);

  const empty = { data: [] as Record<string, unknown>[], error: null };
  const [itin, budget, packing, tasks, festival] = tripIds.length
    ? await Promise.all([
        sb.from("itinerary_items").select("*").in("trip_id", tripIds),
        sb.from("budget_items").select("*").in("trip_id", tripIds),
        sb.from("packing_items").select("*").in("trip_id", tripIds),
        sb.from("travel_tasks").select("*").in("trip_id", tripIds),
        sb.from("festival_details").select("*").in("trip_id", tripIds),
      ])
    : [empty, empty, empty, empty, empty];

  const travelProfileRow = profileRes.data?.[0];

  return {
    user: {
      id: userId,
      email: profile.email,
      displayName: profile.displayName,
      plan: profile.plan,
      createdAt: profile.createdAt,
      isCloud: true,
    },
    travelProfile: travelProfileRow ? fromRow.travel_profiles(travelProfileRow) : null,
    trips,
    itineraryItems: (itin.data ?? []).map(fromRow.itinerary_items),
    budgetItems: (budget.data ?? []).map(fromRow.budget_items),
    packingItems: (packing.data ?? []).map(fromRow.packing_items),
    travelTasks: (tasks.data ?? []).map(fromRow.travel_tasks),
    festivalDetails: (festival.data ?? []).map(fromRow.festival_details),
  };
}

/* ------------------------------ Migrate ------------------------------ */

async function migrateLocalToCloud(userId: string, local: DB) {
  const sb = getSupabase()!;
  const chunks: [RemoteTable, Record<string, unknown>[]][] = [
    ["trips", local.trips.map((t) => toRow.trips(t, userId))],
    ["itinerary_items", local.itineraryItems.map(toRow.itinerary_items)],
    ["budget_items", local.budgetItems.map(toRow.budget_items)],
    ["packing_items", local.packingItems.map(toRow.packing_items)],
    ["travel_tasks", local.travelTasks.map(toRow.travel_tasks)],
    ["festival_details", local.festivalDetails.map(toRow.festival_details)],
  ];
  if (local.travelProfile) {
    chunks.push([
      "travel_profiles",
      [toRow.travel_profiles(local.travelProfile, userId)],
    ]);
  }
  for (const [table, rows] of chunks) {
    if (rows.length === 0) continue;
    const { error } = await sb.from(table).upsert(rows);
    if (error) logSyncError(`migrate ${table}`, error);
  }
}

/* ------------------------------ Connect ------------------------------ */

type CloudProfile = {
  email: string;
  displayName: string;
  plan: UserPlan;
  createdAt: string;
};

async function fetchCloudProfile(user: User): Promise<CloudProfile> {
  const sb = getSupabase()!;
  const { data } = await sb
    .from("users")
    .select("email, display_name, plan, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (data) {
    return {
      email: data.email ?? user.email ?? "",
      displayName: data.display_name ?? user.email?.split("@")[0] ?? "Traveler",
      plan: data.plan === "premium" ? "premium" : "free",
      createdAt: data.created_at ?? new Date().toISOString(),
    };
  }

  // No row yet (signup trigger missing or delayed) — create one.
  const fallback = {
    id: user.id,
    email: user.email ?? "",
    display_name: user.email?.split("@")[0] ?? "Traveler",
  };
  const { error } = await sb.from("users").upsert(fallback);
  if (error) logSyncError("create users row", error);
  return {
    email: fallback.email,
    displayName: fallback.display_name,
    plan: "free",
    createdAt: new Date().toISOString(),
  };
}

export async function connectCloud(user: User) {
  if (connectedUserId === user.id) return;
  const sb = getSupabase();
  if (!sb) return;

  try {
    const profile = await fetchCloudProfile(user);
    const local = getLocalDB();

    // First sign-in with local demo data and an empty cloud account:
    // carry the local trips into the account instead of discarding them.
    const { count, error: countError } = await sb
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const cloudIsEmpty = !countError && (count ?? 0) === 0;
    const localHasData = !local.user.isCloud && local.trips.length > 0;

    if (cloudIsEmpty && localHasData) {
      await migrateLocalToCloud(user.id, local);
    }

    const db = await pullAll(user.id, profile);
    replaceAll(db);
    setRemoteSink(makeSink(user.id));
    connectedUserId = user.id;
  } catch (error) {
    logSyncError("connect", error);
  }
}

export function disconnectCloud() {
  if (connectedUserId === null) return;
  connectedUserId = null;
  setRemoteSink(null);
  replaceAll(null); // back to a fresh local demo state
}

/** Re-read the account's plan (e.g. after returning from Stripe checkout). */
export async function refreshPlan() {
  const sb = getSupabase();
  if (!sb || !connectedUserId) return;
  const { data } = await sb
    .from("users")
    .select("plan")
    .eq("id", connectedUserId)
    .maybeSingle();
  if (data) updateLocalPlan(data.plan === "premium" ? "premium" : "free");
}
