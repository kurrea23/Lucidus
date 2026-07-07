export type UserPlan = "free" | "premium";

export type TripType =
  | "vacation"
  | "festival"
  | "business"
  | "road_trip"
  | "adventure"
  | "wellness"
  | "romantic"
  | "family"
  | "budget"
  | "luxury"
  | "solo";

export type TripPace = "light" | "balanced" | "packed";

export type BudgetStyle = "cheapest" | "smart_value" | "premium" | "luxury";

export type TransportStyle =
  | "walking"
  | "rideshare"
  | "rental_car"
  | "public_transit"
  | "shuttle"
  | "mixed";

export type FoodStyle =
  | "cheap_eats"
  | "local_gems"
  | "healthy"
  | "high_protein"
  | "fine_dining"
  | "dietary"
  | "late_night"
  | "festival_food";

export type LodgingStyle =
  | "cheapest"
  | "clean_simple"
  | "walkable"
  | "boutique"
  | "resort"
  | "luxury"
  | "group_house"
  | "festival_camping";

export type ItineraryCategory =
  | "travel"
  | "food"
  | "activity"
  | "event"
  | "hotel"
  | "transport"
  | "free_time"
  | "recovery"
  | "nightlife";

export type BudgetCategory =
  | "flights"
  | "lodging"
  | "food"
  | "transportation"
  | "activities"
  | "shopping"
  | "festivalTickets"
  | "emergencyBuffer"
  | "other";

export type PackingCategory =
  | "documents"
  | "clothing"
  | "toiletries"
  | "tech"
  | "health"
  | "festival"
  | "emergency"
  | "other";

export type TaskPriority = "low" | "normal" | "high";

export type TripStatus = "planning" | "ready" | "completed" | "archived";

/* ----------------------------- Entities ----------------------------- */

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  plan: UserPlan;
  createdAt: string;
  /** True when this state belongs to a signed-in Supabase account. */
  isCloud?: boolean;
};

export type TravelProfile = {
  id: string;
  travelerType: string;
  budgetStyle: string;
  pace: string;
  foodStyle: string;
  transportStyle: string;
  planningMode: string;
  stressPoints: string[];
  preferredExperiences: string[];
  createdAt: string;
};

export type Trip = {
  id: string;
  name: string;
  tripType: TripType;
  destination: string;
  origin: string;
  startDate: string | null;
  endDate: string | null;
  isFestivalMode: boolean;
  festivalName?: string;
  status: TripStatus;
  targetBudget: number;
  amountSaved: number;
  travelerCount: number;
  notes: string;
  createdAt: string;
};

export type ItineraryItem = {
  id: string;
  tripId: string;
  title: string;
  itemDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
  category: ItineraryCategory;
  estimatedCost: number;
  notes: string;
  reservationStatus: "not_needed" | "needed" | "booked";
  createdAt: string;
};

export type BudgetItem = {
  id: string;
  tripId: string;
  category: BudgetCategory;
  label: string;
  estimatedAmount: number;
  paidAmount: number;
  notes: string;
  createdAt: string;
};

export type PackingItem = {
  id: string;
  tripId: string;
  label: string;
  category: PackingCategory;
  isPacked: boolean;
  quantity: number;
  notes: string;
  createdAt: string;
};

export type TravelTask = {
  id: string;
  tripId: string;
  title: string;
  category: string;
  priority: TaskPriority;
  dueDate: string | null;
  isDone: boolean;
  notes: string;
  createdAt: string;
};

export type FestivalDetails = {
  id: string;
  tripId: string;
  festivalName: string;
  ticketStatus: "not_added" | "need_tickets" | "have_tickets" | "wristband_registered";
  lodgingType: string;
  venueTransportation: string;
  meetupSpot: string;
  afterpartyPlan: string;
  recoveryPlan: string;
};

/* --------------------------- AI trip planner --------------------------- */

export type TripInterviewInput = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  tripType: TripType;
  budget: number;
  travelerCount: number;
  travelStyle: string[];
  pace: TripPace;
  foodStyle: FoodStyle;
  transportStyle: TransportStyle;
  stressPoints: string[];
  isFestivalMode: boolean;
  festivalName?: string;
  // Extended interview answers
  flexibleDates?: boolean;
  isInternational?: boolean;
  lodgingStyle?: LodgingStyle;
  priorities?: string[];
  wantsCostReduction?: boolean;
  wantsDailyEstimate?: boolean;
  festival?: {
    hasTickets: boolean;
    lodgingType: string;
    wantsSetPlanning: boolean;
    wantsOutfitPlanning: boolean;
    wantsHydrationReminders: boolean;
    wantsAfterpartyPlanning: boolean;
    wantsMeetupPlanning: boolean;
  };
};

export type GeneratedTripPlan = {
  tripName: string;
  travelDNA: {
    travelerType: string;
    budgetStyle: string;
    pace: string;
    foodStyle: string;
    transportStyle: string;
    planningMode: string;
    stressPoints: string[];
    preferredExperiences: string[];
  };
  budgetItems: {
    category: BudgetCategory;
    label: string;
    estimatedAmount: number;
  }[];
  packingItems: {
    label: string;
    category: PackingCategory;
    quantity?: number;
  }[];
  travelTasks: {
    title: string;
    category: string;
    priority: TaskPriority;
  }[];
  itineraryItems: {
    title: string;
    itemDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    category: ItineraryCategory;
    estimatedCost?: number;
    notes?: string;
  }[];
  festivalDetails?: {
    festivalName: string;
    ticketStatus: string;
    lodgingType: string;
    venueTransportation: string;
    meetupSpot: string;
    afterpartyPlan: string;
    recoveryPlan: string;
  };
};

/* ------------------------------- Labels ------------------------------- */

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  vacation: "Vacation",
  festival: "Festival / Event",
  business: "Business",
  road_trip: "Road Trip",
  adventure: "Adventure",
  wellness: "Wellness",
  romantic: "Romantic",
  family: "Family",
  budget: "Budget Escape",
  luxury: "Luxury",
  solo: "Solo Trip",
};

export const FOOD_STYLE_LABELS: Record<FoodStyle, string> = {
  cheap_eats: "Cheap Eats",
  local_gems: "Local Gems",
  healthy: "Healthy",
  high_protein: "High Protein",
  fine_dining: "Fine Dining",
  dietary: "Vegan / Vegetarian / GF",
  late_night: "Late-Night Food",
  festival_food: "Festival Food",
};

export const TRANSPORT_STYLE_LABELS: Record<TransportStyle, string> = {
  walking: "Walking",
  rideshare: "Uber / Lyft",
  rental_car: "Rental Car",
  public_transit: "Public Transit",
  shuttle: "Shuttle",
  mixed: "Mixed",
};

export const LODGING_STYLE_LABELS: Record<LodgingStyle, string> = {
  cheapest: "Cheapest Acceptable",
  clean_simple: "Clean & Simple",
  walkable: "Walkable Location",
  boutique: "Boutique",
  resort: "Resort",
  luxury: "Luxury",
  group_house: "Group House",
  festival_camping: "Festival Camping",
};

export const PACKING_CATEGORY_LABELS: Record<PackingCategory, string> = {
  documents: "Documents",
  clothing: "Clothing",
  toiletries: "Toiletries",
  tech: "Tech",
  health: "Health",
  festival: "Festival",
  emergency: "Emergency",
  other: "Other",
};

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  flights: "Flights",
  lodging: "Lodging",
  food: "Food",
  transportation: "Transportation",
  activities: "Activities",
  shopping: "Shopping",
  festivalTickets: "Festival Tickets",
  emergencyBuffer: "Emergency Buffer",
  other: "Other",
};

export const ITINERARY_CATEGORY_LABELS: Record<ItineraryCategory, string> = {
  travel: "Travel",
  food: "Food",
  activity: "Activity",
  event: "Event",
  hotel: "Hotel",
  transport: "Transport",
  free_time: "Free Time",
  recovery: "Recovery",
  nightlife: "Nightlife",
};
