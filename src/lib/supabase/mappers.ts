import type {
  BudgetItem,
  FestivalDetails,
  ItineraryItem,
  PackingItem,
  TravelProfile,
  TravelTask,
  Trip,
} from "@/lib/types";

/**
 * Local entities are camelCase; Supabase rows are snake_case.
 * These mappers are the single source of truth for that translation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const trimTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);

export const toRow = {
  trips(t: Trip, userId: string): Row {
    return {
      id: t.id,
      user_id: userId,
      name: t.name,
      trip_type: t.tripType,
      destination: t.destination,
      origin: t.origin,
      start_date: t.startDate,
      end_date: t.endDate,
      is_festival_mode: t.isFestivalMode,
      festival_name: t.festivalName ?? null,
      status: t.status,
      target_budget: t.targetBudget,
      amount_saved: t.amountSaved,
      traveler_count: t.travelerCount,
      notes: t.notes,
      created_at: t.createdAt,
    };
  },
  itinerary_items(i: ItineraryItem): Row {
    return {
      id: i.id,
      trip_id: i.tripId,
      title: i.title,
      item_date: i.itemDate,
      start_time: i.startTime || null,
      end_time: i.endTime || null,
      location: i.location,
      category: i.category,
      estimated_cost: i.estimatedCost,
      notes: i.notes,
      reservation_status: i.reservationStatus,
      created_at: i.createdAt,
    };
  },
  budget_items(b: BudgetItem): Row {
    return {
      id: b.id,
      trip_id: b.tripId,
      category: b.category,
      label: b.label,
      estimated_amount: b.estimatedAmount,
      paid_amount: b.paidAmount,
      notes: b.notes,
      created_at: b.createdAt,
    };
  },
  packing_items(p: PackingItem): Row {
    return {
      id: p.id,
      trip_id: p.tripId,
      label: p.label,
      category: p.category,
      is_packed: p.isPacked,
      quantity: p.quantity,
      notes: p.notes,
      created_at: p.createdAt,
    };
  },
  travel_tasks(t: TravelTask): Row {
    return {
      id: t.id,
      trip_id: t.tripId,
      title: t.title,
      category: t.category,
      priority: t.priority,
      due_date: t.dueDate,
      is_done: t.isDone,
      notes: t.notes,
      created_at: t.createdAt,
    };
  },
  festival_details(f: FestivalDetails): Row {
    return {
      id: f.id,
      trip_id: f.tripId,
      festival_name: f.festivalName,
      ticket_status: f.ticketStatus,
      lodging_type: f.lodgingType,
      venue_transportation: f.venueTransportation,
      meetup_spot: f.meetupSpot,
      afterparty_plan: f.afterpartyPlan,
      recovery_plan: f.recoveryPlan,
    };
  },
  travel_profiles(p: TravelProfile, userId: string): Row {
    return {
      id: p.id,
      user_id: userId,
      traveler_type: p.travelerType,
      budget_style: p.budgetStyle,
      pace: p.pace,
      food_style: p.foodStyle,
      transport_style: p.transportStyle,
      planning_mode: p.planningMode,
      stress_points: p.stressPoints,
      preferred_experiences: p.preferredExperiences,
      created_at: p.createdAt,
    };
  },
};

export const fromRow = {
  trips(r: Row): Trip {
    return {
      id: r.id,
      name: r.name ?? "",
      tripType: r.trip_type ?? "vacation",
      destination: r.destination ?? "",
      origin: r.origin ?? "",
      startDate: r.start_date,
      endDate: r.end_date,
      isFestivalMode: Boolean(r.is_festival_mode),
      festivalName: r.festival_name ?? undefined,
      status: r.status ?? "planning",
      targetBudget: Number(r.target_budget) || 0,
      amountSaved: Number(r.amount_saved) || 0,
      travelerCount: Number(r.traveler_count) || 1,
      notes: r.notes ?? "",
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  },
  itinerary_items(r: Row): ItineraryItem {
    return {
      id: r.id,
      tripId: r.trip_id,
      title: r.title ?? "",
      itemDate: r.item_date,
      startTime: trimTime(r.start_time),
      endTime: trimTime(r.end_time),
      location: r.location ?? "",
      category: r.category ?? "activity",
      estimatedCost: Number(r.estimated_cost) || 0,
      notes: r.notes ?? "",
      reservationStatus: r.reservation_status ?? "not_needed",
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  },
  budget_items(r: Row): BudgetItem {
    return {
      id: r.id,
      tripId: r.trip_id,
      category: r.category ?? "other",
      label: r.label ?? "",
      estimatedAmount: Number(r.estimated_amount) || 0,
      paidAmount: Number(r.paid_amount) || 0,
      notes: r.notes ?? "",
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  },
  packing_items(r: Row): PackingItem {
    return {
      id: r.id,
      tripId: r.trip_id,
      label: r.label ?? "",
      category: r.category ?? "other",
      isPacked: Boolean(r.is_packed),
      quantity: Number(r.quantity) || 1,
      notes: r.notes ?? "",
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  },
  travel_tasks(r: Row): TravelTask {
    return {
      id: r.id,
      tripId: r.trip_id,
      title: r.title ?? "",
      category: r.category ?? "general",
      priority: r.priority ?? "normal",
      dueDate: r.due_date,
      isDone: Boolean(r.is_done),
      notes: r.notes ?? "",
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  },
  festival_details(r: Row): FestivalDetails {
    return {
      id: r.id,
      tripId: r.trip_id,
      festivalName: r.festival_name ?? "",
      ticketStatus: r.ticket_status ?? "not_added",
      lodgingType: r.lodging_type ?? "",
      venueTransportation: r.venue_transportation ?? "",
      meetupSpot: r.meetup_spot ?? "",
      afterpartyPlan: r.afterparty_plan ?? "",
      recoveryPlan: r.recovery_plan ?? "",
    };
  },
  travel_profiles(r: Row): TravelProfile {
    return {
      id: r.id,
      travelerType: r.traveler_type ?? "",
      budgetStyle: r.budget_style ?? "",
      pace: r.pace ?? "",
      foodStyle: r.food_style ?? "",
      transportStyle: r.transport_style ?? "",
      planningMode: r.planning_mode ?? "",
      stressPoints: Array.isArray(r.stress_points) ? r.stress_points : [],
      preferredExperiences: Array.isArray(r.preferred_experiences)
        ? r.preferred_experiences
        : [],
      createdAt: r.created_at ?? new Date().toISOString(),
    };
  },
};
