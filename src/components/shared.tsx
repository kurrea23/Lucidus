import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarRange } from "lucide-react";
import { cn, formatDateRange } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col items-center gap-2 p-10 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-sand-100 text-ocean-600">
        <Icon className="size-6" />
      </span>
      <h3 className="font-semibold text-charcoal-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-charcoal-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "default" | "green" | "red" | "blue";
}) {
  const valueColor =
    accent === "green"
      ? "text-emerald-600"
      : accent === "red"
        ? "text-red-600"
        : accent === "blue"
          ? "text-ocean-700"
          : "text-charcoal-900";
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">{label}</p>
      <p className={cn("mt-1 text-xl font-bold", valueColor)}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-charcoal-500">{hint}</p>}
    </Card>
  );
}

export function DateRangeDisplay({
  start,
  end,
  className,
}: {
  start: string | null | undefined;
  end: string | null | undefined;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-charcoal-500", className)}>
      <CalendarRange className="size-4" />
      {formatDateRange(start, end)}
    </span>
  );
}

export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-ocean-700 hover:text-ocean-800 hover:underline"
    >
      {children}
    </Link>
  );
}
