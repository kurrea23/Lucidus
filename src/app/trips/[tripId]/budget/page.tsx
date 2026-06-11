"use client";

import { use, useState } from "react";
import { Plus, Trash2, Wallet, X } from "lucide-react";
import { addBudgetItem, deleteBudgetItem, updateBudgetItem, updateTrip } from "@/lib/store";
import {
  BUDGET_CATEGORY_LABELS,
  type BudgetCategory,
  type BudgetItem,
} from "@/lib/types";
import { daysBetween, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState, StatCard } from "@/components/shared";
import { TripShell } from "@/components/trip-shell";

function BudgetRow({ item }: { item: BudgetItem }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-charcoal-900">{item.label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-charcoal-400">est.</span>
        <Input
          type="number"
          min={0}
          className="h-8 w-24 text-right"
          value={item.estimatedAmount || ""}
          placeholder="0"
          onChange={(e) =>
            updateBudgetItem(item.id, { estimatedAmount: Number(e.target.value) || 0 })
          }
          aria-label={`${item.label} estimated amount`}
        />
        <span className="text-xs text-charcoal-400">paid</span>
        <Input
          type="number"
          min={0}
          className="h-8 w-24 text-right"
          value={item.paidAmount || ""}
          placeholder="0"
          onChange={(e) =>
            updateBudgetItem(item.id, { paidAmount: Number(e.target.value) || 0 })
          }
          aria-label={`${item.label} paid amount`}
        />
        <Button
          variant="danger"
          size="sm"
          aria-label={`Delete ${item.label}`}
          onClick={() => deleteBudgetItem(item.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BudgetPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<BudgetCategory>("other");
  const [estimated, setEstimated] = useState("");

  function addItem() {
    addBudgetItem({
      tripId,
      category,
      label: label.trim(),
      estimatedAmount: Number(estimated) || 0,
      paidAmount: 0,
      notes: "",
    });
    setLabel("");
    setEstimated("");
    setAdding(false);
  }

  return (
    <TripShell tripId={tripId} active="/budget">
      {(bundle) => {
        const { trip, budgetItems } = bundle;
        const totalEstimated = budgetItems.reduce((s, b) => s + b.estimatedAmount, 0);
        const totalPaid = budgetItems.reduce((s, b) => s + b.paidAmount, 0);
        const days =
          trip.startDate && trip.endDate
            ? Math.max(1, daysBetween(trip.startDate, trip.endDate) + 1)
            : null;
        const overBy = trip.targetBudget > 0 ? totalEstimated - trip.targetBudget : 0;

        const byCategory = new Map<BudgetCategory, BudgetItem[]>();
        for (const item of budgetItems) {
          byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
        }

        return (
          <div className="space-y-5">
            {/* Targets */}
            <Card>
              <CardHeader>
                <CardTitle>Budget targets</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="target">Target budget ($)</Label>
                  <Input
                    id="target"
                    type="number"
                    min={0}
                    value={trip.targetBudget || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateTrip(trip.id, { targetBudget: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="saved">Saved so far ($)</Label>
                  <Input
                    id="saved"
                    type="number"
                    min={0}
                    value={trip.amountSaved || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateTrip(trip.id, { amountSaved: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Estimated total" value={formatMoney(totalEstimated)} />
              <StatCard label="Paid so far" value={formatMoney(totalPaid)} accent="green" />
              <StatCard
                label="Still to save"
                value={formatMoney(Math.max(0, totalEstimated - trip.amountSaved))}
              />
              <StatCard
                label="Daily spend"
                value={days ? `${formatMoney(totalEstimated / days)}` : "—"}
                hint={days ? `over ${days} days` : "set dates first"}
                accent="blue"
              />
            </div>

            {overBy > 0 && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                This trip is currently {formatMoney(overBy)} over your{" "}
                {formatMoney(trip.targetBudget)} target budget.
              </p>
            )}

            {/* Add form */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Budget lines</h2>
              {!adding && (
                <Button onClick={() => setAdding(true)}>
                  <Plus className="size-4" /> Add line
                </Button>
              )}
            </div>

            {adding && (
              <Card className="border-ocean-200 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="bl-label">Label</Label>
                    <Input
                      id="bl-label"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Concert tickets"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bl-category">Category</Label>
                    <Select
                      id="bl-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BudgetCategory)}
                    >
                      {Object.entries(BUDGET_CATEGORY_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bl-estimated">Estimated ($)</Label>
                    <Input
                      id="bl-estimated"
                      type="number"
                      min={0}
                      value={estimated}
                      onChange={(e) => setEstimated(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setAdding(false)}>
                    <X className="size-4" /> Cancel
                  </Button>
                  <Button onClick={addItem} disabled={!label.trim()}>
                    Add line
                  </Button>
                </div>
              </Card>
            )}

            {budgetItems.length === 0 && !adding ? (
              <EmptyState
                icon={Wallet}
                title="No budget lines yet"
                description="Add estimated costs by category so TripCooker can track your spend."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[...byCategory.entries()].map(([cat, items]) => {
                  const est = items.reduce((s, i) => s + i.estimatedAmount, 0);
                  const paid = items.reduce((s, i) => s + i.paidAmount, 0);
                  return (
                    <Card key={cat}>
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>{BUDGET_CATEGORY_LABELS[cat]}</CardTitle>
                        <span className="text-sm text-charcoal-500">
                          <span className="font-semibold text-charcoal-900">
                            {formatMoney(paid)}
                          </span>{" "}
                          / {formatMoney(est)}
                        </span>
                      </CardHeader>
                      <CardContent className="divide-y divide-sand-100">
                        {items.map((item) => (
                          <BudgetRow key={item.id} item={item} />
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      }}
    </TripShell>
  );
}
