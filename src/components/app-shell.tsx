"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChefHat,
  Crown,
  LayoutDashboard,
  Map,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { activeTrips, useDB } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Travel Year", icon: CalendarDays },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-ocean-700 text-white">
        <ChefHat className="size-4.5" />
      </span>
      <span className="text-lg tracking-tight text-charcoal-900">TripCooker</span>
    </Link>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Map;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-ocean-700 text-white"
          : "text-charcoal-700 hover:bg-sand-100 hover:text-charcoal-900"
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const db = useDB();
  const trips = activeTrips(db);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sand-200 bg-white p-4 gap-6 sticky top-0 h-screen">
        <Logo />
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>
        {trips.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
              My Trips
            </p>
            <nav className="flex flex-col gap-1">
              {trips.map((t) => (
                <NavLink
                  key={t.id}
                  href={`/trips/${t.id}`}
                  label={t.destination || t.name}
                  icon={Map}
                  active={pathname.startsWith(`/trips/${t.id}`)}
                />
              ))}
            </nav>
          </div>
        )}
        <div className="mt-auto">
          {db.user.plan === "premium" ? (
            <Badge variant="blue" className="w-full justify-center py-1.5">
              <Crown className="size-3" /> Travel Season Pro
            </Badge>
          ) : (
            <Link
              href="/premium"
              className="flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3 text-xs text-charcoal-700 hover:border-ocean-300"
            >
              <Sparkles className="size-4 text-ocean-600 shrink-0" />
              <span>
                <span className="font-semibold block text-charcoal-900">Build your travel year</span>
                Unlock unlimited trips with Premium.
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-sand-200 bg-white px-4 py-3">
          <Logo />
          <Badge variant={db.user.plan === "premium" ? "blue" : "default"}>
            {db.user.plan === "premium" ? "Pro" : "Free"}
          </Badge>
        </header>

        <main className="flex-1 pb-24 md:pb-10">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-sand-200 bg-white">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                  active ? "text-ocean-700" : "text-charcoal-400"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-charcoal-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
