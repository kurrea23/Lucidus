import type {
  BudgetItem,
  FestivalDetails,
  ItineraryItem,
  PackingItem,
  TravelProfile,
  TravelTask,
  Trip,
  UserProfile,
} from "./types";
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
export function emptyDatabase(
  id = "local-user",
  email = "",
  createdAt = new Date().toISOString(),
): DB {
  return {
    user: { id, email, displayName: "Traveler", plan: "free", createdAt },
    travelProfile: null,
    trips: [],
    itineraryItems: [],
    budgetItems: [],
    packingItems: [],
    travelTasks: [],
    festivalDetails: [],
  };
}
