import Link from "next/link";
import { ArrowRight, Flame, Wallet } from "lucide-react";
import type { TripBundle } from "@/lib/readiness";
import { calculateReadinessScore, nextAction, readinessCopy } from "@/lib/readiness";
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from "@/lib/types";
import { daysBetween, formatMoney } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { SectionLink } from "@/components/shared";

export function ReadinessScoreCard({ bundle }: { bundle: TripBundle }) {
  const score = calculateReadinessScore(bundle);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-ocean-600" />
          Trip Readiness
        </CardTitle>
        <span className="text-2xl font-bold text-ocean-700">{score}%</span>
      </CardHeader>
      <CardContent>
        <ProgressBar
          value={score}
          barClassName={score === 100 ? "bg-emerald-500" : undefined}
        />
        <p className="mt-2 text-sm text-charcoal-500">
          <span className="font-semibold text-charcoal-700">{score}% cooked</span> —{" "}
          {readinessCopy(score)}
        </p>
      </CardContent>
    </Card>
  );
}

export function NextActionCard({ bundle }: { bundle: TripBundle }) {
  const action = nextAction(bundle);
  if (!action) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-5">
          <p className="font-semibold text-emerald-800">Your trip is cooked. 🎉</p>
          <p className="mt-1 text-sm text-emerald-700">
            Everything on the readiness checklist is handled. Enjoy the trip.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-ocean-200 bg-ocean-50">
      <CardContent className="pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">
          Next step
        </p>
        <p className="mt-1 font-semibold text-charcoal-900">{action.title}</p>
        <p className="mt-1 text-sm text-charcoal-500">{action.description}</p>
        <Link
          href={action.href(bundle.trip.id)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ocean-700 hover:underline"
        >
          Take care of it <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

export function BudgetSnapshotCard({ bundle }: { bundle: TripBundle }) {
  const { trip, budgetItems } = bundle;
  const totalEstimated = budgetItems.reduce((s, b) => s + b.estimatedAmount, 0);
  const totalPaid = budgetItems.reduce((s, b) => s + b.paidAmount, 0);
  const remaining = Math.max(0, totalEstimated - trip.amountSaved);
  const days =
    trip.startDate && trip.endDate
      ? Math.max(1, daysBetween(trip.startDate, trip.endDate) + 1)
      : null;
  const overBy = trip.targetBudget > 0 ? totalEstimated - trip.targetBudget : 0;

  const byCategory = new Map<BudgetCategory, number>();
  for (const b of budgetItems) {
    byCategory.set(b.category, (byCategory.get(b.category) ?? 0) + b.estimatedAmount);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-4 text-ocean-600" />
          Budget Snapshot
        </CardTitle>
        <SectionLink href={`/trips/${trip.id}/budget`}>Open budget</SectionLink>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-charcoal-400">Estimated</p>
            <p className="font-bold text-charcoal-900">{formatMoney(totalEstimated)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400">Saved</p>
            <p className="font-bold text-emerald-600">{formatMoney(trip.amountSaved)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400">Still to save</p>
            <p className="font-bold text-charcoal-900">{formatMoney(remaining)}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400">Daily spend</p>
            <p className="font-bold text-charcoal-900">
              {days ? `${formatMoney(totalEstimated / days)}/day` : "—"}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-charcoal-400">
          {formatMoney(totalPaid)} already paid
        </p>

        {overBy > 0 && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            This trip is currently {formatMoney(overBy)} over your{" "}
            {formatMoney(trip.targetBudget)} target budget.
          </p>
        )}

        {byCategory.size > 0 && (
          <div className="mt-4 space-y-2">
            {[...byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cat, amount]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-charcoal-500">
                    {BUDGET_CATEGORY_LABELS[cat]}
                  </span>
                  <ProgressBar
                    value={totalEstimated > 0 ? (amount / totalEstimated) * 100 : 0}
                    className="h-1.5"
                  />
                  <span className="w-16 shrink-0 text-right text-xs font-medium text-charcoal-700">
                    {formatMoney(amount)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
