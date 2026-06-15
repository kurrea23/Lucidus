import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChefHat,
  Crown,
  LayoutDashboard,
  MessageCircleQuestion,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoButton } from "@/components/demo-button";
import { Logo } from "@/components/app-shell";

const FREE_FEATURES = [
  "1 active trip",
  "Travel interview & Travel DNA",
  "Trip dashboard with readiness score",
  "Itinerary, budget & countdown",
  "Packing list & task checklist",
  "Festival Mode for your trip",
];

const PREMIUM_FEATURES = [
  "Unlimited trips",
  "Yearly travel calendar",
  "Annual travel budget",
  "Multi-trip dashboard & archive",
  "Group planning & split costs",
  "Advanced Festival Mode + AI concierge",
];

const MOCK_YEAR = [
  { month: "May", trip: "EDC Las Vegas", color: "bg-neon-100 text-neon-700" },
  { month: "July", trip: "Beach Trip", color: "bg-ocean-100 text-ocean-800" },
  { month: "September", trip: "Lost Lands", color: "bg-neon-100 text-neon-700" },
  { month: "November", trip: "EDSea", color: "bg-ocean-100 text-ocean-800" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-sand-200 bg-sand-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/premium">
              <Button variant="ghost" size="sm">
                Premium
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Open App</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 text-center md:px-8 md:pt-24">
        <Badge variant="blue" className="mb-4">
          <Sparkles className="size-3" /> AI-powered travel planning
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-charcoal-900 md:text-6xl">
          Cook one trip free.{" "}
          <span className="text-ocean-700">Build your travel year</span> with Premium.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-charcoal-500">
          TripCooker interviews you first, learns your travel style, and turns your
          trip into a dashboard, checklist, budget, and itinerary.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding">
            <Button size="lg">
              <ChefHat className="size-4" /> Start Cooking a Trip
            </Button>
          </Link>
          <DemoButton />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-2xl font-bold md:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: MessageCircleQuestion,
              title: "1. Answer the travel interview",
              body: "Tell us where you're headed, your vibe, your budget, and what stresses you out.",
            },
            {
              icon: LayoutDashboard,
              title: "2. Get your trip dashboard",
              body: "TripCooker cooks a personalized itinerary, budget, packing list, and task list — with a readiness score.",
            },
            {
              icon: CalendarDays,
              title: "3. Build your whole year",
              body: "Upgrade when you're ready to plan every trip, festival, and getaway in one travel calendar.",
            },
          ].map((c) => (
            <Card key={c.title} className="p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-ocean-100 text-ocean-700">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-charcoal-900">{c.title}</h3>
              <p className="mt-2 text-sm text-charcoal-500">{c.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Free vs Premium</h2>
        <p className="mt-2 text-center text-charcoal-500">
          Plan one trip free. Build your travel year with Premium.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-bold">Free</h3>
            <p className="text-sm text-charcoal-500">Your first trip, fully cooked.</p>
            <ul className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-charcoal-700">
                  <Check className="size-4 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-ocean-700 bg-ocean-900 p-6 text-white">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Crown className="size-5 text-amber-300" /> Travel Season Pro
            </h3>
            <p className="text-sm text-ocean-200">Your whole travel year, organized.</p>
            <ul className="mt-4 space-y-2">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-amber-300" /> {f}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Festival Mode */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
        <Card className="overflow-hidden border-neon-300">
          <div className="grid md:grid-cols-2">
            <div className="bg-charcoal-900 p-8 text-white">
              <Badge variant="neon" className="mb-3">
                <PartyPopper className="size-3" /> Festival Mode
              </Badge>
              <h2 className="text-2xl font-bold md:text-3xl">
                Built different for festivals.
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Wristbands, hydration packs, set schedules, meetup spots, afterparties,
                recovery days — Festival Mode swaps in everything an event trip actually
                needs.
              </p>
            </div>
            <div className="p-8">
              <ul className="space-y-2.5">
                {[
                  "Festival packing list (earplugs, electrolytes, hydration pack)",
                  "Ticket & wristband tracking",
                  "Venue transportation planning",
                  "Friend meetup spot",
                  "Afterparty & recovery planning",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-charcoal-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-neon-600" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Travel Year Calendar */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8">
        <h2 className="text-center text-2xl font-bold md:text-3xl">
          Your travel year, on one calendar
        </h2>
        <p className="mt-2 text-center text-charcoal-500">
          Premium turns scattered trips into a planned travel season.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {MOCK_YEAR.map((m) => (
            <Card key={m.month} className="p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                {m.month}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${m.color}`}
              >
                {m.trip}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8">
        <Card className="bg-ocean-900 p-10 text-center text-white">
          <h2 className="text-2xl font-bold md:text-3xl">
            What kind of trip are we cooking?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-ocean-200">
            Your first trip is free. No credit card, no spreadsheets — just answers.
          </p>
          <Link href="/onboarding" className="mt-6 inline-block">
            <Button size="lg" className="bg-white text-ocean-900 hover:bg-sand-100">
              <ChefHat className="size-4" /> Start Cooking a Trip
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-sand-200 py-8 text-center text-sm text-charcoal-400">
        TripCooker — turn scattered travel ideas into a cooked plan.
      </footer>
    </div>
  );
}
