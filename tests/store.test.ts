import test from "node:test";
import assert from "node:assert/strict";
import { mockTripPlanner } from "../src/lib/ai-trip-planner";
import { databaseSchema } from "../src/lib/validation";
import {
  createTripFromPlan,
  currentData,
  updateUser,
  updateTrip,
  togglePackingItem,
  toggleTravelTask,
  addBudgetItem,
  deleteTrip,
  canCreateTrip,
  resetAll,
  saveTravelProfile,
} from "../src/lib/store";
const input = {
  origin: "Phoenix",
  destination: "Las Vegas",
  startDate: "2027-04-02",
  endDate: "2027-04-05",
  tripType: "festival" as const,
  budget: 1200,
  travelerCount: 1,
  travelStyle: [],
  pace: "balanced" as const,
  foodStyle: "local_gems" as const,
  transportStyle: "walking" as const,
  stressPoints: [],
  isFestivalMode: true,
  festivalName: "QA Festival",
};
test("full trip lifecycle preserves relational data and free restrictions", () => {
  resetAll();
  const plan = mockTripPlanner(input);
  saveTravelProfile(plan.travelDNA);
  const id = createTripFromPlan(input, plan);
  assert.ok(databaseSchema.safeParse(currentData()).success);
  assert.equal(canCreateTrip(currentData()), false);
  assert.throws(() => createTripFromPlan(input, plan), /free plan/);
  const p = currentData().packingItems[0],
    t = currentData().travelTasks[0];
  togglePackingItem(p.id);
  toggleTravelTask(t.id);
  assert.equal(currentData().packingItems[0].isPacked, true);
  assert.equal(currentData().travelTasks[0].isDone, true);
  addBudgetItem({
    tripId: id,
    label: "QA",
    category: "other",
    estimatedAmount: 20,
    paidAmount: 10,
    notes: "",
  });
  updateTrip(id, { targetBudget: -1 });
  assert.equal(currentData().trips[0].targetBudget, 1200);
  updateTrip(id, { status: "completed" });
  assert.equal(canCreateTrip(currentData()), true);
  const second = createTripFromPlan(input, plan);
  updateUser({ plan: "premium" });
  assert.equal(canCreateTrip(currentData()), true);
  deleteTrip(id);
  assert.ok(currentData().budgetItems.every((i) => i.tripId !== id));
  assert.ok(currentData().packingItems.every((i) => i.tripId !== id));
  assert.equal(currentData().trips[0].id, second);
  assert.ok(databaseSchema.safeParse(currentData()).success);
  resetAll();
});
