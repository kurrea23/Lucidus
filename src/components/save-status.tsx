"use client";
import { useState } from "react";
import { LIVE_MODE } from "@/lib/app-config";
import {
  currentData,
  discardPending,
  hasUnsavedChanges,
  retrySave,
  useSaveStatus,
} from "@/lib/store";
import { useAccount } from "./account-provider";
import { Button } from "./ui/button";
export function exportTripData() {
  const blob = new Blob([JSON.stringify(currentData(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tripcooker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
export function SaveStatus() {
  const status = useSaveStatus();
  const account = useAccount();
  const [error, setError] = useState("");
  const problem =
    status.state === "error" || status.state === "conflict" || status.message;
  if (!LIVE_MODE && !problem)
    return (
      <p className="bg-sand-100 px-4 py-2 text-center text-xs text-charcoal-500">
        Demo preview · saved in this browser · no payments
      </p>
    );
  return (
    <div
      role="status"
      className={`px-4 py-2 text-sm ${problem ? "bg-amber-50 text-amber-900" : "bg-sand-50 text-charcoal-500"}`}
    >
      <p>
        {status.message ||
          (status.state === "saving"
            ? "Saving your changes…"
            : "Saved to your account")}
        {error && ` ${error}`}
      </p>
      {problem && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportTripData}>
            Export my changes
          </Button>
          {status.state === "error" && (
            <Button size="sm" onClick={() => void retrySave()}>
              Retry save
            </Button>
          )}
          {LIVE_MODE && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (
                  hasUnsavedChanges() &&
                  !confirm(
                    "Load the saved account version? Export your changes first. Unsaved browser changes will be replaced.",
                  )
                )
                  return;
                discardPending();
                // A deliberate reload resets the queue and reads the server version.
                window.location.reload();
              }}
            >
              Load saved version
            </Button>
          )}
        </div>
      )}
      {!problem && LIVE_MODE && (
        <button
          className="ml-2 underline"
          onClick={() => {
            void account.refresh().catch((e) => setError(e.message));
          }}
        >
          Refresh from account
        </button>
      )}
    </div>
  );
}
