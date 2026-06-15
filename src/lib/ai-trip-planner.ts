import {
  type BudgetCategory,
  type GeneratedTripPlan,
  type ItineraryCategory,
  type TripInterviewInput,
  type TripType,
  TRIP_TYPE_LABELS,
  FOOD_STYLE_LABELS,
  TRANSPORT_STYLE_LABELS,
} from "./types";
import { addDays, daysBetween } from "./utils";

/**
 * AI trip planner. If an AI API key is configured this is where a real model
 * call would go; for the MVP it produces a deterministic, personalized plan
 * from the interview answers using templates.
 */
export async function aiTripPlanner(
  input: TripInterviewInput
): Promise<GeneratedTripPlan> {
  // No API key in MVP — always use the deterministic mock planner.
  return mockTripPlanner(input);
}

/* ----------------------------- Travel DNA ----------------------------- */

const PACE_WORDS: Record<string, string> = {
  light: "Chill",
  balanced: "Balanced",
  packed: "High-Energy",
};

const TYPE_WORDS: Record<TripType, string> = {
  vacation: "Vacation",
  festival: "Festival",
  business: "Business Travel",
  road_trip: "Road Trip",
  adventure: "Adventure",
  wellness: "Wellness",
  romantic: "Getaway",
  family: "Family Trip",
  budget: "Budget Travel",
  luxury: "Luxury Travel",
  solo: "Solo Travel",
};

function deriveBudgetStyle(input: TripInterviewInput): string {
  const p = input.priorities ?? [];
  if (input.tripType === "luxury" || p.includes("Luxury")) return "Luxury";
  if (p.includes("Comfort") || p.includes("Convenience")) return "Comfort First";
  if (input.tripType === "budget" || p.includes("Cheapest trip") || input.wantsCostReduction)
    return "Budget Hunter";
  return "Smart Value";
}

function derivePlanningMode(input: TripInterviewInput): string {
  if (input.stressPoints.includes("Overplanning")) return "Light Touch";
  if (
    input.stressPoints.includes("Underplanning") ||
    input.stressPoints.includes("Being late")
  )
    return "Guided";
  return "Flexible";
}

function derivePreferredExperiences(input: TripInterviewInput): string[] {
  const out = new Set<string>();
  for (const vibe of input.travelStyle) out.add(vibe);
  for (const p of input.priorities ?? []) {
    if (["Food", "Nightlife", "Nature", "Photos/content"].includes(p)) out.add(p);
  }
  if (input.isFestivalMode) {
    out.add("Music");
    out.add("Recovery");
  }
  return [...out].slice(0, 6);
}

/* ----------------------------- Budget split ----------------------------- */

type Split = Partial<Record<BudgetCategory, number>>;

function budgetSplit(input: TripInterviewInput): Split {
  if (input.isFestivalMode) {
    return {
      festivalTickets: 0.22,
      flights: 0.18,
      lodging: 0.25,
      food: 0.12,
      transportation: 0.08,
      shopping: 0.05,
      emergencyBuffer: 0.1,
    };
  }
  switch (input.tripType) {
    case "road_trip":
      return {
        transportation: 0.3,
        lodging: 0.28,
        food: 0.18,
        activities: 0.12,
        shopping: 0.04,
        emergencyBuffer: 0.08,
      };
    case "luxury":
      return {
        flights: 0.25,
        lodging: 0.38,
        food: 0.18,
        transportation: 0.05,
        activities: 0.09,
        emergencyBuffer: 0.05,
      };
    case "business":
      return {
        flights: 0.35,
        lodging: 0.35,
        food: 0.15,
        transportation: 0.1,
        emergencyBuffer: 0.05,
      };
    default:
      return {
        flights: 0.28,
        lodging: 0.3,
        food: 0.15,
        transportation: 0.08,
        activities: 0.1,
        shopping: 0.04,
        emergencyBuffer: 0.05,
      };
  }
}

const BUDGET_LABELS: Record<BudgetCategory, string> = {
  flights: "Round-trip flights",
  lodging: "Lodging",
  food: "Food & drinks",
  transportation: "Getting around",
  activities: "Activities & experiences",
  shopping: "Shopping & souvenirs",
  festivalTickets: "Festival tickets",
  emergencyBuffer: "Emergency buffer",
  other: "Other",
};

/* ------------------------------- Planner ------------------------------- */

export function mockTripPlanner(input: TripInterviewInput): GeneratedTripPlan {
  const nights = Math.max(1, daysBetween(input.startDate, input.endDate));
  const days = nights + 1;
  const dest = input.destination || "Your Destination";

  /* Trip name */
  const tripName = input.isFestivalMode
    ? `${input.festivalName || "Festival"} — ${dest}`
    : `${dest} ${TRIP_TYPE_LABELS[input.tripType]}`;

  /* Travel DNA */
  const travelDNA = {
    travelerType: `${PACE_WORDS[input.pace]} ${TYPE_WORDS[input.tripType]} Planner`,
    budgetStyle: deriveBudgetStyle(input),
    pace: input.pace.charAt(0).toUpperCase() + input.pace.slice(1),
    foodStyle: FOOD_STYLE_LABELS[input.foodStyle],
    transportStyle: TRANSPORT_STYLE_LABELS[input.transportStyle],
    planningMode: derivePlanningMode(input),
    stressPoints: input.stressPoints,
    preferredExperiences: derivePreferredExperiences(input),
  };

  /* Budget items */
  const split = budgetSplit(input);
  const budgetItems = (Object.entries(split) as [BudgetCategory, number][])
    .filter(([, pct]) => pct > 0)
    .map(([category, pct]) => ({
      category,
      label: BUDGET_LABELS[category],
      // Round down so the generated estimate never starts over the target budget.
      estimatedAmount: Math.floor((input.budget * pct) / 10) * 10,
    }));

  /* Packing list */
  const packingItems: GeneratedTripPlan["packingItems"] = [
    { label: "ID / driver's license", category: "documents" },
    { label: "Wallet & cards", category: "documents" },
    { label: "Travel documents & confirmations", category: "documents" },
    { label: "Phone charger", category: "tech" },
    { label: "Portable charger", category: "tech" },
    { label: "Toiletries kit", category: "toiletries" },
    { label: "Medication", category: "health" },
    { label: `Outfits (${days} days)`, category: "clothing", quantity: days },
    { label: "Comfortable shoes", category: "clothing" },
    { label: "Sunglasses", category: "clothing" },
    { label: "Sunscreen", category: "health" },
  ];
  if (input.isInternational) {
    packingItems.unshift({ label: "Passport", category: "documents" });
  }
  if (input.isFestivalMode) {
    packingItems.push(
      { label: "Festival wristband / ticket", category: "festival" },
      { label: "Hydration pack", category: "festival" },
      { label: "Earplugs", category: "festival" },
      { label: "Electrolyte packets", category: "festival" },
      { label: "Bandana", category: "festival" },
      { label: "Hand fan", category: "festival" },
      { label: "Gum", category: "festival" },
      { label: "Festival outfits by day", category: "festival", quantity: nights },
      { label: "Recovery supplements", category: "health" },
      { label: "Emergency meetup location card", category: "emergency" }
    );
  }
  if (input.tripType === "wellness") {
    packingItems.push(
      { label: "Workout / yoga clothes", category: "clothing" },
      { label: "Water bottle", category: "health" }
    );
  }
  if (input.tripType === "business") {
    packingItems.push(
      { label: "Laptop & charger", category: "tech" },
      { label: "Business outfits", category: "clothing" }
    );
  }

  /* Tasks */
  const travelTasks: GeneratedTripPlan["travelTasks"] = [
    { title: "Book flight / main transport", category: "transportation", priority: "high" },
    { title: "Book lodging", category: "lodging", priority: "high" },
    { title: "Confirm local transportation", category: "transportation", priority: "normal" },
    { title: "Check the weather forecast", category: "general", priority: "low" },
    { title: "Save lodging address offline", category: "lodging", priority: "normal" },
    { title: "Add emergency contact", category: "emergency", priority: "normal" },
    { title: "Confirm reservations", category: "general", priority: "normal" },
    { title: "Download offline map", category: "general", priority: "low" },
    { title: "Check passport / ID expiration", category: "documents", priority: "high" },
  ];
  if (input.isInternational) {
    travelTasks.push(
      { title: "Notify bank of international travel", category: "documents", priority: "normal" },
      { title: "Consider travel insurance", category: "documents", priority: "low" }
    );
  }
  if (input.tripType === "business") {
    travelTasks.push({
      title: "Set out-of-office reply",
      category: "general",
      priority: "normal",
    });
  }
  if (input.isFestivalMode) {
    const f = input.festival;
    travelTasks.push(
      {
        title: f?.hasTickets ? "Register festival wristband" : "Buy festival ticket",
        category: "festival",
        priority: "high",
      },
      { title: "Check festival bag policy", category: "festival", priority: "normal" },
      { title: "Screenshot the set schedule", category: "festival", priority: "normal" },
      { title: "Book shuttle / venue transportation", category: "festival", priority: "high" },
      { title: "Plan water & hydration strategy", category: "festival", priority: "normal" }
    );
    if (f?.wantsOutfitPlanning)
      travelTasks.push({ title: "Plan outfits by day", category: "festival", priority: "normal" });
    if (f?.wantsMeetupPlanning)
      travelTasks.push({ title: "Pick a friend meetup spot", category: "festival", priority: "normal" });
    if (f?.wantsAfterpartyPlanning)
      travelTasks.push({
        title: "Plan afterparty transportation",
        category: "festival",
        priority: "low",
      });
    travelTasks.push({ title: "Set a recovery day", category: "festival", priority: "low" });
  }

  /* Itinerary */
  const itineraryItems = buildItinerary(input, days, dest);

  /* Festival details */
  const festivalDetails = input.isFestivalMode
    ? {
        festivalName: input.festivalName || "Festival",
        ticketStatus: input.festival?.hasTickets ? "have_tickets" : "need_tickets",
        lodgingType: input.festival?.lodgingType || "",
        venueTransportation:
          input.transportStyle === "shuttle" ? "Festival shuttle" : "",
        meetupSpot: "",
        afterpartyPlan: "",
        recoveryPlan: input.festival?.wantsHydrationReminders
          ? "Hydrate every set break, electrolytes each morning, sleep-in day after."
          : "",
      }
    : undefined;

  return {
    tripName,
    travelDNA,
    budgetItems,
    packingItems,
    travelTasks,
    itineraryItems,
    festivalDetails,
  };
}

/* ----------------------------- Itinerary gen ----------------------------- */

type DayActivity = {
  title: string;
  category: ItineraryCategory;
  startTime: string;
  endTime?: string;
  notes?: string;
};

function middleDayActivities(input: TripInterviewInput, dest: string): DayActivity[] {
  const vibes = input.travelStyle;
  const pool: DayActivity[] = [];

  if (input.isFestivalMode) {
    return [
      { title: "Recovery brunch & hydration", category: "recovery", startTime: "11:00", endTime: "12:30" },
      {
        title: `${input.festivalName || "Festival"} — gates open`,
        category: "event",
        startTime: "15:00",
        endTime: "23:30",
        notes: "Screenshot the set schedule and pick must-see sets.",
      },
    ];
  }

  if (vibes.includes("Food-focused") || input.foodStyle === "local_gems") {
    pool.push({ title: `Local food crawl in ${dest}`, category: "food", startTime: "12:00", endTime: "14:00" });
  }
  if (vibes.includes("Culture")) {
    pool.push({ title: "Museum & old town walk", category: "activity", startTime: "10:00", endTime: "12:30" });
  }
  if (vibes.includes("Adventure") || input.tripType === "adventure") {
    pool.push({ title: "Outdoor adventure (hike / tour)", category: "activity", startTime: "09:00", endTime: "13:00" });
  }
  if (vibes.includes("Wellness") || input.tripType === "wellness") {
    pool.push({ title: "Spa / recovery session", category: "recovery", startTime: "10:00", endTime: "12:00" });
  }
  if (vibes.includes("Party") || vibes.includes("Nightlife")) {
    pool.push({ title: "Night out", category: "nightlife", startTime: "21:00", endTime: "23:59" });
  }
  if (vibes.includes("Romantic")) {
    pool.push({ title: "Sunset dinner for two", category: "food", startTime: "19:00", endTime: "21:00" });
  }
  if (input.tripType === "business") {
    pool.unshift({ title: "Work session / meetings", category: "activity", startTime: "09:00", endTime: "17:00" });
  }
  if (pool.length === 0) {
    pool.push({ title: `Explore ${dest}`, category: "activity", startTime: "10:00", endTime: "13:00" });
  }
  pool.push({ title: "Dinner reservation", category: "food", startTime: "19:00", endTime: "20:30" });
  pool.push({ title: "Free time / wander", category: "free_time", startTime: "15:00", endTime: "17:00" });

  const perDay = input.pace === "light" ? 1 : input.pace === "balanced" ? 2 : 3;
  return pool.slice(0, perDay);
}

function buildItinerary(
  input: TripInterviewInput,
  days: number,
  dest: string
): GeneratedTripPlan["itineraryItems"] {
  const items: GeneratedTripPlan["itineraryItems"] = [];
  const activityBudget = Math.round((input.budget * 0.1) / Math.max(1, days - 2) / 10) * 10;

  // Arrival day
  items.push({
    title: `Travel: ${input.origin || "Home"} → ${dest}`,
    itemDate: input.startDate,
    startTime: "08:00",
    endTime: "12:00",
    category: "travel",
    location: dest,
  });
  items.push({
    title: "Check in & explore the neighborhood",
    itemDate: input.startDate,
    startTime: "14:00",
    endTime: "16:00",
    category: "free_time",
    location: dest,
  });

  // Middle days
  const middle = middleDayActivities(input, dest);
  for (let d = 1; d < days - 1; d++) {
    const date = addDays(input.startDate, d);
    for (const act of middle) {
      items.push({
        title: act.title,
        itemDate: date,
        startTime: act.startTime,
        endTime: act.endTime,
        category: act.category,
        location: dest,
        estimatedCost: act.category === "free_time" ? 0 : activityBudget,
        notes: act.notes,
      });
    }
  }

  // Departure day
  if (days > 1) {
    items.push({
      title: `Pack up & travel home: ${dest} → ${input.origin || "Home"}`,
      itemDate: input.endDate,
      startTime: "10:00",
      endTime: "14:00",
      category: "travel",
      location: dest,
    });
  }

  return items;
}
