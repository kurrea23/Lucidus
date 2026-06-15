"use client";

import { AppShell, PageContainer, PageHeader } from "@/components/app-shell";
import { InterviewForm } from "@/components/interview-form";

export default function NewTripPage() {
  return (
    <AppShell>
      <PageContainer className="max-w-2xl">
        <PageHeader
          title="Cook a new trip"
          description="Answer the interview and TripCooker does the rest."
        />
        <InterviewForm />
      </PageContainer>
    </AppShell>
  );
}
