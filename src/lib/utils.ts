import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return usd.format(Math.round(amount));
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  return parseISODate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  return parseISODate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return "Dates TBD";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  const s = parseISODate(start!);
  const e = parseISODate(end!);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sFmt = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const eFmt = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${sFmt} – ${eFmt}`;
}

export function daysBetween(startISO: string, endISO: string): number {
  const ms = parseISODate(endISO).getTime() - parseISODate(startISO).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type Countdown =
  | { kind: "upcoming"; days: number }
  | { kind: "active" }
  | { kind: "past" }
  | { kind: "unknown" };

export function tripCountdown(
  start: string | null | undefined,
  end: string | null | undefined
): Countdown {
  if (!start) return { kind: "unknown" };
  const today = todayISO();
  if (today < start) return { kind: "upcoming", days: daysBetween(today, start) };
  if (end && today > end) return { kind: "past" };
  if (!end && today > start) return { kind: "past" };
  return { kind: "active" };
}

export function countdownLabel(c: Countdown): string {
  switch (c.kind) {
    case "upcoming":
      return c.days === 1 ? "1 day to go" : `${c.days} days to go`;
    case "active":
      return "Happening now";
    case "past":
      return "Trip complete";
    default:
      return "Dates TBD";
  }
}

/** Parse "HH:MM" into minutes since midnight, or null. */
export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function formatTime(time: string | null | undefined): string {
  const mins = timeToMinutes(time);
  if (mins === null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}
