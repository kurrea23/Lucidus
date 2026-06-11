"use client";

import { Logo } from "@/components/app-shell";
import { InterviewForm } from "@/components/interview-form";

export default function OnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <InterviewForm />
    </div>
  );
}
