import { Dna } from "lucide-react";
import type { TravelProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DnaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-charcoal-500">{label}</span>
      <span className="text-sm font-medium text-charcoal-900 text-right">{value}</span>
    </div>
  );
}

export function TravelDNACard({ profile }: { profile: TravelProfile }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-ocean-100 text-ocean-700">
          <Dna className="size-4" />
        </span>
        <div>
          <CardTitle>Your Travel DNA</CardTitle>
          <p className="text-sm text-charcoal-500">{profile.travelerType}</p>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-sand-100">
        <DnaRow label="Budget style" value={profile.budgetStyle} />
        <DnaRow label="Trip pace" value={profile.pace} />
        <DnaRow label="Food mode" value={profile.foodStyle} />
        <DnaRow label="Transport" value={profile.transportStyle} />
        <DnaRow label="Planning mode" value={profile.planningMode} />
        {profile.stressPoints.length > 0 && (
          <div className="pt-2.5">
            <p className="mb-1.5 text-sm text-charcoal-500">Biggest stress points</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.stressPoints.map((s) => (
                <Badge key={s} variant="amber">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {profile.preferredExperiences.length > 0 && (
          <div className="pt-2.5 mt-2.5">
            <p className="mb-1.5 text-sm text-charcoal-500">Loves</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferredExperiences.map((s) => (
                <Badge key={s} variant="blue">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
