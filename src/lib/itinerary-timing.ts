import type { ItineraryItem } from "./types";
import { timeToMinutes } from "./utils";
export function itineraryWarnings(
  items: ItineraryItem[],
): Map<string, "overlap" | "tight"> {
  const warnings = new Map<string, "overlap" | "tight">();
  const timed = items
    .flatMap((item) => {
      const start = timeToMinutes(item.startTime);
      if (!item.itemDate || start === null) return [];
      const end = timeToMinutes(item.endTime) ?? start;
      const day = Date.parse(item.itemDate + "T00:00:00Z") / 60000;
      return [
        {
          id: item.id,
          start: day + start,
          end: day + end + (end < start ? 1440 : 0),
        },
      ];
    })
    .sort((a, b) => a.start - b.start);
  let lastEnd = -Infinity;
  for (const item of timed) {
    const gap = item.start - lastEnd;
    if (gap < 0) warnings.set(item.id, "overlap");
    else if (gap < 30) warnings.set(item.id, "tight");
    lastEnd = Math.max(lastEnd, item.end);
  }
  return warnings;
}
