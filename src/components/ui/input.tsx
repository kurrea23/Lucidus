import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm text-charcoal-900",
        "placeholder:text-charcoal-400",
        "focus:outline-2 focus:outline-offset-1 focus:outline-ocean-500",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-charcoal-900",
        "placeholder:text-charcoal-400 min-h-20",
        "focus:outline-2 focus:outline-offset-1 focus:outline-ocean-500",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-sand-300 bg-white px-3 text-sm text-charcoal-900",
        "focus:outline-2 focus:outline-offset-1 focus:outline-ocean-500",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-charcoal-700 mb-1.5", className)}
      {...props}
    />
  );
}
