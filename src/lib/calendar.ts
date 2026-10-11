import type { Trip } from "./types";
export function tripsForYear(trips: Trip[], year: string): Trip[] {
  return trips.filter(
    (t) => t.status !== "archived" && t.startDate?.slice(0, 4) === year,
  );
}
