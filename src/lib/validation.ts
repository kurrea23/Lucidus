import { z } from "zod";
import {
  BUDGET_CATEGORY_LABELS,
  ITINERARY_CATEGORY_LABELS,
  PACKING_CATEGORY_LABELS,
  TRIP_TYPE_LABELS,
} from "./types";
const text = z.string().max(2000);
const id = z.string().min(1).max(80);
const money = z.number().finite().min(0).max(10_000_000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Enter a valid calendar date.");
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();
const dated = { id, createdAt: z.iso.datetime() };
const child = { ...dated, tripId: id };
const trip = z
  .object({
    ...dated,
    name: text.min(1),
    tripType: z.enum(Object.keys(TRIP_TYPE_LABELS) as [string, ...string[]]),
    destination: text.min(1),
    origin: text,
    startDate: date.nullable(),
    endDate: date.nullable(),
    isFestivalMode: z.boolean(),
    festivalName: text.optional(),
    status: z.enum(["planning", "ready", "completed", "archived"]),
    targetBudget: money,
    amountSaved: money,
    travelerCount: z.number().int().min(1).max(100),
    notes: z.string().max(20_000),
  })
  .strict()
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    "Return date must follow departure.",
  );
export const databaseSchema = z
  .object({
    user: z
      .object({
        ...dated,
        email: z.string().max(320),
        displayName: text,
        plan: z.enum(["free", "premium"]),
      })
      .strict(),
    travelProfile: z
      .object({
        ...dated,
        travelerType: text,
        budgetStyle: text,
        pace: text,
        foodStyle: text,
        transportStyle: text,
        planningMode: text,
        stressPoints: z.array(text).max(100),
        preferredExperiences: z.array(text).max(100),
      })
      .strict()
      .nullable(),
    trips: z.array(trip).max(1000),
    itineraryItems: z
      .array(
        z
          .object({
            ...child,
            title: text.min(1),
            itemDate: date.nullable(),
            startTime: time,
            endTime: time,
            location: text,
            category: z.enum(
              Object.keys(ITINERARY_CATEGORY_LABELS) as [string, ...string[]],
            ),
            estimatedCost: money,
            notes: text,
            reservationStatus: z.enum(["not_needed", "needed", "booked"]),
          })
          .strict(),
      )
      .max(20_000),
    budgetItems: z
      .array(
        z
          .object({
            ...child,
            category: z.enum(
              Object.keys(BUDGET_CATEGORY_LABELS) as [string, ...string[]],
            ),
            label: text.min(1),
            estimatedAmount: money,
            paidAmount: money,
            notes: text,
          })
          .strict(),
      )
      .max(20_000),
    packingItems: z
      .array(
        z
          .object({
            ...child,
            label: text.min(1),
            category: z.enum(
              Object.keys(PACKING_CATEGORY_LABELS) as [string, ...string[]],
            ),
            isPacked: z.boolean(),
            quantity: z.number().int().min(1).max(1000),
            notes: text,
          })
          .strict(),
      )
      .max(20_000),
    travelTasks: z
      .array(
        z
          .object({
            ...child,
            title: text.min(1),
            category: text,
            priority: z.enum(["low", "normal", "high"]),
            dueDate: date.nullable(),
            isDone: z.boolean(),
            notes: text,
          })
          .strict(),
      )
      .max(20_000),
    festivalDetails: z
      .array(
        z
          .object({
            id,
            tripId: id,
            festivalName: text,
            ticketStatus: z.enum([
              "not_added",
              "need_tickets",
              "have_tickets",
              "wristband_registered",
            ]),
            lodgingType: text,
            venueTransportation: text,
            meetupSpot: text,
            afterpartyPlan: text,
            recoveryPlan: text,
          })
          .strict(),
      )
      .max(1000),
  })
  .strict()
  .superRefine((db, ctx) => {
    const ids = new Set(db.trips.map((t) => t.id));
    for (const rows of [
      db.trips,
      db.itineraryItems,
      db.budgetItems,
      db.packingItems,
      db.travelTasks,
      db.festivalDetails,
    ]) {
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        ctx.addIssue({ code: "custom", message: "Duplicate record IDs." });
    }
    for (const rows of [
      db.itineraryItems,
      db.budgetItems,
      db.packingItems,
      db.travelTasks,
      db.festivalDetails,
    ]) {
      if (rows.some((r) => !ids.has(r.tripId)))
        ctx.addIssue({
          code: "custom",
          message: "Item belongs to a missing trip.",
        });
    }
    if (
      new Set(db.festivalDetails.map((r) => r.tripId)).size !==
      db.festivalDetails.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate festival details." });
  });
export function interviewProblem(input: {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelerCount: number;
}): string {
  if (!input.destination.trim()) return "Tell us where you're going.";
  if (
    !date.safeParse(input.startDate).success ||
    !date.safeParse(input.endDate).success
  )
    return "Pick valid trip dates.";
  if (input.endDate < input.startDate)
    return "Your return date is before you leave.";
  if (
    (Date.parse(input.endDate) - Date.parse(input.startDate)) / 86_400_000 >
    365
  )
    return "Plan up to one year per trip.";
  if (!money.safeParse(input.budget).success || input.budget === 0)
    return "Enter a budget between $1 and $10,000,000.";
  if (
    !Number.isInteger(input.travelerCount) ||
    input.travelerCount < 1 ||
    input.travelerCount > 100
  )
    return "Enter 1 to 100 travelers.";
  return "";
}
