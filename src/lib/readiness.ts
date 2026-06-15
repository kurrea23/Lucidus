import type {
  BudgetItem,
  ItineraryItem,
  PackingItem,
  TravelTask,
  Trip,
} from "./types";

export type TripBundle = {
  trip: Trip;
  budgetItems: BudgetItem[];
  packingItems: PackingItem[];
  itineraryItems: ItineraryItem[];
  travelTasks: TravelTask[];
};

function lodgingHandled(b: TripBundle): boolean {
  return (
    b.budgetItems.some((i) => i.category === "lodging" && i.paidAmount > 0) ||
    b.travelTasks.some(
      (t) => t.isDone && (t.category === "lodging" || /lodging|hotel|airbnb/i.test(t.title))
    )
  );
}

function transportationHandled(b: TripBundle): boolean {
  return (
    b.budgetItems.some(
      (i) => (i.category === "flights" || i.category === "transportation") && i.paidAmount > 0
    ) ||
    b.travelTasks.some(
      (t) =>
        t.isDone &&
        (t.category === "transportation" || /flight|transport|shuttle|train|car/i.test(t.title))
    )
  );
}

function emergencyHandled(b: TripBundle): boolean {
  return (
    b.travelTasks.some(
      (t) => t.isDone && (t.category === "emergency" || /emergency/i.test(t.title))
    ) ||
    b.packingItems.some((p) => p.category === "emergency" && p.isPacked) ||
    /emergency/i.test(b.trip.notes)
  );
}

export function calculateReadinessScore(bundle: TripBundle): number {
  let score = 0;
  if (bundle.trip.startDate && bundle.trip.endDate) score += 15;
  if (lodgingHandled(bundle)) score += 15;
  if (transportationHandled(bundle)) score += 15;
  if (bundle.budgetItems.length >= 3) score += 15;
  if (bundle.packingItems.length >= 5) score += 15;
  if (bundle.itineraryItems.length >= 2) score += 15;
  if (emergencyHandled(bundle)) score += 10;
  return Math.min(score, 100);
}

export function readinessCopy(score: number): string {
  if (score <= 25) return "Barely started — let's cook the basics.";
  if (score <= 50) return "Half-prepped — your trip has shape.";
  if (score <= 75) return "Mostly cooked — a few details need attention.";
  if (score <= 99) return "Almost ready — final checks left.";
  return "Fully cooked — you're ready to go.";
}

export type NextAction = {
  title: string;
  description: string;
  href: (tripId: string) => string;
};

/** The next most important action for a trip, in priority order. */
export function nextAction(bundle: TripBundle): NextAction | null {
  if (!bundle.trip.startDate || !bundle.trip.endDate) {
    return {
      title: "Set your trip dates",
      description: "Everything else — countdown, itinerary, budget — keys off your dates.",
      href: (id) => `/trips/${id}`,
    };
  }
  if (!lodgingHandled(bundle)) {
    return {
      title: "Lock in lodging",
      description: "Book your stay, then mark the lodging task done or log the payment in your budget.",
      href: (id) => `/trips/${id}/tasks`,
    };
  }
  if (!transportationHandled(bundle)) {
    return {
      title: "Confirm transportation",
      description: "Book flights or transport and check it off so your readiness score moves.",
      href: (id) => `/trips/${id}/tasks`,
    };
  }
  if (bundle.budgetItems.length < 3) {
    return {
      title: "Build out your budget",
      description: "Add at least three budget lines so TripCooker can track your spend.",
      href: (id) => `/trips/${id}/budget`,
    };
  }
  if (bundle.packingItems.length < 5) {
    return {
      title: "Finish your packing list",
      description: "Add at least five packing items so nothing gets left behind.",
      href: (id) => `/trips/${id}/packing`,
    };
  }
  if (bundle.itineraryItems.length < 2) {
    return {
      title: "Sketch your itinerary",
      description: "Add a couple of itinerary items so each day has shape.",
      href: (id) => `/trips/${id}/itinerary`,
    };
  }
  if (!emergencyHandled(bundle)) {
    return {
      title: "Add emergency info",
      description: "Add an emergency contact task and check it off — 10 easy readiness points.",
      href: (id) => `/trips/${id}/tasks`,
    };
  }
  return null;
}
