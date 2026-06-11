"use client";

import { use, useState } from "react";
import { Luggage, Plus, Trash2 } from "lucide-react";
import { addPackingItem, deletePackingItem, togglePackingItem } from "@/lib/store";
import {
  PACKING_CATEGORY_LABELS,
  type PackingCategory,
  type PackingItem,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, Select } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared";
import { TripShell } from "@/components/trip-shell";

function PackingRow({ item }: { item: PackingItem }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Checkbox
        checked={item.isPacked}
        onToggle={() => togglePackingItem(item.id)}
        label={`Mark ${item.label} as packed`}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          item.isPacked ? "text-charcoal-400 line-through" : "text-charcoal-900"
        )}
      >
        {item.label}
        {item.quantity > 1 && (
          <span className="ml-1 text-charcoal-400">×{item.quantity}</span>
        )}
      </span>
      <Button
        variant="danger"
        size="sm"
        aria-label={`Delete ${item.label}`}
        onClick={() => deletePackingItem(item.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function PackingPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<PackingCategory>("other");

  function addItem() {
    if (!label.trim()) return;
    addPackingItem({
      tripId,
      label: label.trim(),
      category,
      isPacked: false,
      quantity: 1,
      notes: "",
    });
    setLabel("");
  }

  return (
    <TripShell tripId={tripId} active="/packing">
      {(bundle) => {
        const items = bundle.packingItems;
        const packed = items.filter((i) => i.isPacked).length;
        const pct = items.length > 0 ? (packed / items.length) * 100 : 0;

        const byCategory = new Map<PackingCategory, PackingItem[]>();
        for (const item of items) {
          byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
        }

        return (
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Smart Checklist</h2>
                <span className="text-sm font-semibold text-ocean-700">
                  {Math.round(pct)}% packed ({packed}/{items.length})
                </span>
              </div>
              <ProgressBar
                value={pct}
                className="mt-2"
                barClassName={pct === 100 ? "bg-emerald-500" : undefined}
              />
            </Card>

            {/* Add */}
            <Card className="p-4">
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  addItem();
                }}
              >
                <Input
                  className="min-w-40 flex-1"
                  placeholder="Add an item…"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <Select
                  className="w-40"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PackingCategory)}
                >
                  {Object.entries(PACKING_CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={!label.trim()}>
                  <Plus className="size-4" /> Add
                </Button>
              </form>
            </Card>

            {items.length === 0 ? (
              <EmptyState
                icon={Luggage}
                title="Nothing to pack yet"
                description="Add items above — TripCooker normally cooks a starter list from your interview."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[...byCategory.entries()].map(([cat, catItems]) => (
                  <Card key={cat}>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle>{PACKING_CATEGORY_LABELS[cat]}</CardTitle>
                      <span className="text-xs text-charcoal-400">
                        {catItems.filter((i) => i.isPacked).length}/{catItems.length} packed
                      </span>
                    </CardHeader>
                    <CardContent className="divide-y divide-sand-100">
                      {catItems.map((item) => (
                        <PackingRow key={item.id} item={item} />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </TripShell>
  );
}
