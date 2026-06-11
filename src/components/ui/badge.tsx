import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "blue" | "green" | "amber" | "red" | "neon" | "outline";

const variantClasses: Record<Variant, string> = {
  default: "bg-sand-200 text-charcoal-700",
  blue: "bg-ocean-100 text-ocean-800",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  neon: "bg-neon-600 text-white",
  outline: "border border-sand-300 text-charcoal-500",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
