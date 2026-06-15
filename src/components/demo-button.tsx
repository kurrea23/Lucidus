"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { seedDemoTrip, useDB } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function DemoButton() {
  const router = useRouter();
  const db = useDB();
  const [loading, setLoading] = useState(false);

  function viewDemo() {
    setLoading(true);
    if (db.trips.length === 0) {
      const tripId = seedDemoTrip();
      router.push(`/trips/${tripId}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <Button variant="outline" size="lg" onClick={viewDemo} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      View Demo
    </Button>
  );
}
