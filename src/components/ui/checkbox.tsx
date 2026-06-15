"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onToggle,
  label,
  className,
}: {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "size-5 shrink-0 rounded-md border flex items-center justify-center transition-colors cursor-pointer",
        checked
          ? "bg-ocean-600 border-ocean-600 text-white"
          : "bg-white border-sand-300 hover:border-ocean-400",
        className
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </button>
  );
}
