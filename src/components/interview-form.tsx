"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Car,
  ChefHat,
  Crown,
  Heart,
  Loader2,
  Mountain,
  Music,
  PartyPopper,
  PiggyBank,
  Plane,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { aiTripPlanner } from "@/lib/ai-trip-planner";
import { canCreateTrip, createTripFromPlan, saveTravelProfile, useDB } from "@/lib/store";
import { PremiumGateCard } from "@/components/premium-gate-card";
import {
  type FoodStyle,
  type LodgingStyle,
  type TransportStyle,
  type TripInterviewInput,
  type TripPace,
  type TripType,
  FOOD_STYLE_LABELS,
  LODGING_STYLE_LABELS,
  TRANSPORT_STYLE_LABELS,
} from "@/lib/types";
import { addDays, cn, todayISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";

/* ------------------------------ Option data ------------------------------ */

const TRIP_TYPES: { value: TripType; label: string; icon: typeof Plane }[] = [
  { value: "vacation", label: "Vacation", icon: Plane },
  { value: "festival", label: "Festival / Event", icon: Music },
  { value: "business", label: "Business", icon: Briefcase },
  { value: "road_trip", label: "Road Trip", icon: Car },
  { value: "adventure", label: "Adventure", icon: Mountain },
  { value: "wellness", label: "Wellness", icon: Sparkles },
  { value: "romantic", label: "Romantic", icon: Heart },
  { value: "family", label: "Family", icon: Users },
  { value: "budget", label: "Budget Escape", icon: PiggyBank },
  { value: "luxury", label: "Luxury", icon: Crown },
  { value: "solo", label: "Solo Trip", icon: User },
];

const VIBES = [
  "Chill",
  "Balanced",
  "Packed",
  "Adventure",
  "Luxury",
  "Party",
  "Romantic",
  "Wellness",
  "Culture",
  "Food-focused",
];

const PRIORITIES = [
  "Cheapest trip",
  "Best value",
  "Comfort",
  "Unique experience",
  "Luxury",
  "Convenience",
  "Safety",
  "Food",
  "Nightlife",
  "Nature",
  "Photos/content",
];

const STRESS_POINTS = [
  "Airports",
  "Packing",
  "Budget",
  "Food",
  "Safety",
  "Transportation",
  "Being late",
  "Overplanning",
  "Underplanning",
  "Group coordination",
];

/* ----------------------------- Small widgets ----------------------------- */

function Chip({
  selected,
  onClick,
  children,
  neon,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  neon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
        selected
          ? neon
            ? "border-neon-600 bg-neon-600 text-white"
            : "border-ocean-700 bg-ocean-700 text-white"
          : "border-sand-300 bg-white text-charcoal-700 hover:border-ocean-400"
      )}
    >
      {children}
    </button>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip
          key={opt}
          selected={value.includes(opt)}
          onClick={() =>
            onChange(
              value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]
            )
          }
        >
          {labels ? labels[opt] : opt}
        </Chip>
      ))}
    </div>
  );
}

function SingleChipGroup<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip key={opt} selected={value === opt} onClick={() => onChange(opt)}>
          {labels ? labels[opt] : opt}
        </Chip>
      ))}
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <Chip selected={value} onClick={() => onChange(true)}>
        Yes
      </Chip>
      <Chip selected={!value} onClick={() => onChange(false)}>
        No
      </Chip>
    </div>
  );
}

function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-charcoal-700">{label}</p>
      {children}
    </div>
  );
}

/* ------------------------------- Form state ------------------------------- */

type FormState = {
  tripType: TripType;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  flexibleDates: boolean;
  travelerCount: number;
  isInternational: boolean;
  vibes: string[];
  pace: TripPace;
  priorities: string[];
  budget: number;
  wantsCostReduction: boolean;
  wantsDailyEstimate: boolean;
  lodgingStyle: LodgingStyle;
  transportStyle: TransportStyle;
  foodStyle: FoodStyle;
  stressPoints: string[];
  festivalName: string;
  hasTickets: boolean;
  festivalLodging: string;
  wantsSetPlanning: boolean;
  wantsOutfitPlanning: boolean;
  wantsHydrationReminders: boolean;
  wantsAfterpartyPlanning: boolean;
  wantsMeetupPlanning: boolean;
};

const INITIAL: FormState = {
  tripType: "vacation",
  origin: "",
  destination: "",
  startDate: addDays(todayISO(), 30),
  endDate: addDays(todayISO(), 34),
  flexibleDates: false,
  travelerCount: 1,
  isInternational: false,
  vibes: [],
  pace: "balanced",
  priorities: [],
  budget: 1500,
  wantsCostReduction: true,
  wantsDailyEstimate: true,
  lodgingStyle: "clean_simple",
  transportStyle: "mixed",
  foodStyle: "local_gems",
  stressPoints: [],
  festivalName: "",
  hasTickets: false,
  festivalLodging: "Hotel",
  wantsSetPlanning: true,
  wantsOutfitPlanning: true,
  wantsHydrationReminders: true,
  wantsAfterpartyPlanning: false,
  wantsMeetupPlanning: true,
};

/* --------------------------------- Steps --------------------------------- */

export function InterviewForm() {
  const router = useRouter();
  const db = useDB();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState(0);
  const [cooking, setCooking] = useState(false);
  const [error, setError] = useState("");

  const isFestival = form.tripType === "festival";
  const steps = isFestival
    ? ["Trip type", "Basics", "Style", "Budget", "Stay & moves", "Food & stress", "Festival"]
    : ["Trip type", "Basics", "Style", "Budget", "Stay & moves", "Food & stress"];
  const lastStep = steps.length - 1;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validateStep(): string {
    if (step === 1) {
      if (!form.destination.trim()) return "Tell us where you're going.";
      if (!form.startDate || !form.endDate) return "Pick your trip dates.";
      if (form.endDate < form.startDate) return "Your return date is before you leave.";
    }
    if (step === 3 && (!form.budget || form.budget <= 0))
      return "Give us a rough budget — you can change it later.";
    if (isFestival && step === lastStep && !form.festivalName.trim())
      return "Which festival or event are you attending?";
    return "";
  }

  async function cookTrip() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setCooking(true);
    const input: TripInterviewInput = {
      origin: form.origin,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      tripType: form.tripType,
      budget: form.budget,
      travelerCount: form.travelerCount,
      travelStyle: form.vibes,
      pace: form.pace,
      foodStyle: form.foodStyle,
      transportStyle: form.transportStyle,
      stressPoints: form.stressPoints,
      isFestivalMode: isFestival,
      festivalName: isFestival ? form.festivalName : undefined,
      flexibleDates: form.flexibleDates,
      isInternational: form.isInternational,
      lodgingStyle: form.lodgingStyle,
      priorities: form.priorities,
      wantsCostReduction: form.wantsCostReduction,
      wantsDailyEstimate: form.wantsDailyEstimate,
      festival: isFestival
        ? {
            hasTickets: form.hasTickets,
            lodgingType: form.festivalLodging,
            wantsSetPlanning: form.wantsSetPlanning,
            wantsOutfitPlanning: form.wantsOutfitPlanning,
            wantsHydrationReminders: form.wantsHydrationReminders,
            wantsAfterpartyPlanning: form.wantsAfterpartyPlanning,
            wantsMeetupPlanning: form.wantsMeetupPlanning,
          }
        : undefined,
    };

    const plan = await aiTripPlanner(input);
    // Brief pause so "cooking" feels like work is happening, before the store
    // write makes the free-plan gate kick in elsewhere.
    await new Promise((r) => setTimeout(r, 900));
    saveTravelProfile(plan.travelDNA);
    const tripId = createTripFromPlan(input, plan);
    router.push(`/trips/${tripId}`);
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    if (step === lastStep) {
      void cookTrip();
    } else {
      setStep(step + 1);
    }
  }

  // Free plan: one active trip. Never gate mid-cook — the store write happens
  // right before navigation and would otherwise flash the gate.
  if (!cooking && !canCreateTrip(db)) {
    return <PremiumGateCard />;
  }

  if (cooking) {
    return (
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-ocean-100 text-ocean-700">
          <ChefHat className="size-7" />
        </span>
        <h2 className="text-xl font-bold">Cooking your trip…</h2>
        <p className="max-w-sm text-sm text-charcoal-500">
          Building your Travel DNA, itinerary, budget, packing list, and task list
          from your answers.
        </p>
        <Loader2 className="size-5 animate-spin text-ocean-600" />
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-charcoal-500">
          <span>
            Step {step + 1} of {steps.length} — {steps[step]}
          </span>
          <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <ProgressBar value={((step + 1) / steps.length) * 100} />
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold">What kind of trip are we cooking?</h2>
            <p className="mt-1 text-sm text-charcoal-500">
              This shapes your checklist, budget, and itinerary.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TRIP_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("tripType", value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors cursor-pointer",
                    form.tripType === value
                      ? value === "festival"
                        ? "border-neon-600 bg-neon-100 text-neon-700"
                        : "border-ocean-700 bg-ocean-50 text-ocean-800"
                      : "border-sand-200 bg-white text-charcoal-700 hover:border-ocean-300"
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
            {isFestival && (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-neon-100 px-3 py-2 text-sm text-neon-700">
                <PartyPopper className="size-4" />
                Festival Mode will be enabled for this trip.
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">The basics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="origin">Where are you leaving from?</Label>
                <Input
                  id="origin"
                  placeholder="e.g. Los Angeles, CA"
                  value={form.origin}
                  onChange={(e) => set("origin", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="destination">Where are you going?</Label>
                <Input
                  id="destination"
                  placeholder="e.g. Las Vegas, NV"
                  value={form.destination}
                  onChange={(e) => set("destination", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="start">Leaving on</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">Coming back on</Label>
                <Input
                  id="end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </div>
            </div>
            <Question label="Are your dates flexible?">
              <YesNo value={form.flexibleDates} onChange={(v) => set("flexibleDates", v)} />
            </Question>
            <Question label="Traveling solo or with others?">
              <div className="flex items-center gap-3">
                <SingleChipGroup
                  options={["1", "2", "3", "4", "5+"] as const}
                  value={form.travelerCount >= 5 ? "5+" : (String(form.travelerCount) as "1")}
                  onChange={(v) => set("travelerCount", v === "5+" ? 5 : Number(v))}
                />
                <span className="text-sm text-charcoal-500">travelers</span>
              </div>
            </Question>
            <Question label="Domestic or international?">
              <div className="flex gap-2">
                <Chip
                  selected={!form.isInternational}
                  onClick={() => set("isInternational", false)}
                >
                  Domestic
                </Chip>
                <Chip
                  selected={form.isInternational}
                  onClick={() => set("isInternational", true)}
                >
                  International
                </Chip>
              </div>
            </Question>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Your travel style</h2>
            <Question label="What vibe do you want? (pick any)">
              <ChipGroup options={VIBES} value={form.vibes} onChange={(v) => set("vibes", v)} />
            </Question>
            <Question label="What pace do you like?">
              <SingleChipGroup
                options={["light", "balanced", "packed"] as const}
                value={form.pace}
                onChange={(v) => set("pace", v)}
                labels={{ light: "Light", balanced: "Balanced", packed: "Packed" }}
              />
            </Question>
            <Question label="What matters most? (pick any)">
              <ChipGroup
                options={PRIORITIES}
                value={form.priorities}
                onChange={(v) => set("priorities", v)}
              />
            </Question>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Money talk</h2>
            <div>
              <Label htmlFor="budget">What is your total trip budget? (USD)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                step={50}
                value={form.budget || ""}
                onChange={(e) => set("budget", Number(e.target.value))}
              />
            </div>
            <Question label="Want TripCooker to help reduce cost?">
              <YesNo
                value={form.wantsCostReduction}
                onChange={(v) => set("wantsCostReduction", v)}
              />
            </Question>
            <Question label="Want a daily spend estimate?">
              <YesNo
                value={form.wantsDailyEstimate}
                onChange={(v) => set("wantsDailyEstimate", v)}
              />
            </Question>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Where you stay, how you move</h2>
            <Question label="What lodging style do you prefer?">
              <SingleChipGroup
                options={Object.keys(LODGING_STYLE_LABELS) as LodgingStyle[]}
                value={form.lodgingStyle}
                onChange={(v) => set("lodgingStyle", v)}
                labels={LODGING_STYLE_LABELS}
              />
            </Question>
            <Question label="What transport style do you prefer?">
              <SingleChipGroup
                options={Object.keys(TRANSPORT_STYLE_LABELS) as TransportStyle[]}
                value={form.transportStyle}
                onChange={(v) => set("transportStyle", v)}
                labels={TRANSPORT_STYLE_LABELS}
              />
            </Question>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Food & stress</h2>
            <Question label="What food style do you want?">
              <SingleChipGroup
                options={Object.keys(FOOD_STYLE_LABELS) as FoodStyle[]}
                value={form.foodStyle}
                onChange={(v) => set("foodStyle", v)}
                labels={FOOD_STYLE_LABELS}
              />
            </Question>
            <Question label="What stresses you out most while traveling? (pick any)">
              <ChipGroup
                options={STRESS_POINTS}
                value={form.stressPoints}
                onChange={(v) => set("stressPoints", v)}
              />
            </Question>
          </div>
        )}

        {isFestival && step === 6 && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <PartyPopper className="size-5 text-neon-600" />
              Festival Mode
            </h2>
            <div>
              <Label htmlFor="festName">What festival or event are you attending?</Label>
              <Input
                id="festName"
                placeholder="e.g. EDC Las Vegas"
                value={form.festivalName}
                onChange={(e) => set("festivalName", e.target.value)}
              />
            </div>
            <Question label="Do you have tickets already?">
              <YesNo value={form.hasTickets} onChange={(v) => set("hasTickets", v)} />
            </Question>
            <Question label="Where are you staying?">
              <SingleChipGroup
                options={["Hotel", "Airbnb", "Camping", "With friends"] as const}
                value={form.festivalLodging as "Hotel"}
                onChange={(v) => set("festivalLodging", v)}
              />
            </Question>
            <div className="grid gap-4 sm:grid-cols-2">
              <Question label="Set planning?">
                <YesNo value={form.wantsSetPlanning} onChange={(v) => set("wantsSetPlanning", v)} />
              </Question>
              <Question label="Outfit planning?">
                <YesNo
                  value={form.wantsOutfitPlanning}
                  onChange={(v) => set("wantsOutfitPlanning", v)}
                />
              </Question>
              <Question label="Hydration / recovery reminders?">
                <YesNo
                  value={form.wantsHydrationReminders}
                  onChange={(v) => set("wantsHydrationReminders", v)}
                />
              </Question>
              <Question label="Afterparty planning?">
                <YesNo
                  value={form.wantsAfterpartyPlanning}
                  onChange={(v) => set("wantsAfterpartyPlanning", v)}
                />
              </Question>
              <Question label="Friend meetup planning?">
                <YesNo
                  value={form.wantsMeetupPlanning}
                  onChange={(v) => set("wantsMeetupPlanning", v)}
                />
              </Question>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setError("");
              setStep(Math.max(0, step - 1));
            }}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button onClick={next} variant={step === lastStep ? "primary" : "primary"}>
            {step === lastStep ? (
              <>
                <ChefHat className="size-4" /> Cook my trip
              </>
            ) : (
              <>
                Next <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
