import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number; // 0–100
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2.5 w-full rounded-full bg-sand-200 overflow-hidden", className)}
    >
      <div
        className={cn("h-full rounded-full bg-ocean-600 transition-all", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
