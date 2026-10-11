"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { AUTH_CONFIGURED, LIVE_MODE } from "@/lib/app-config";
import { accountRequest, authClient } from "@/lib/auth-client";
import { clearRemote, connectRemote, hasUnsavedChanges } from "@/lib/store";
import { SaveError } from "@/lib/sync-queue";
type AccountState = {
  phase: "loading" | "ready" | "signed-out" | "error";
  message: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AccountContext = createContext<AccountState>({
  phase: "loading",
  message: "",
  refresh: async () => {},
  signOut: async () => {},
});
export function useAccount() {
  return useContext(AccountContext);
}
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AccountState, "refresh" | "signOut">>(
    {
      phase: LIVE_MODE ? (AUTH_CONFIGURED ? "loading" : "error") : "ready",
      message:
        LIVE_MODE && !AUTH_CONFIGURED
          ? "TripCooker accounts are not open yet. Please check back soon."
          : "",
    },
  );
  async function refresh() {
    if (hasUnsavedChanges())
      throw new Error("Save or export pending changes first.");
    const result = await accountRequest("/api/state");
    const ownID: string = result.data.user.id;
    connectRemote(result.data, result.version, async (data, version) => {
      const session = (await authClient().auth.getSession()).data.session;
      if (session?.user.id !== ownID)
        throw new SaveError(
          401,
          "Your account session changed. Sign in again.",
        );
      return accountRequest("/api/state", "PUT", { data, version }, ownID);
    });
    setState({ phase: "ready", message: "" });
  }
  useEffect(() => {
    if (!LIVE_MODE) return;
    if (!AUTH_CONFIGURED) return;
    let alive = true;
    let loadedID: string | null = null;
    let generation = 0;
    const {
      data: { subscription },
    } = authClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user.id === loadedID && session) return;
      loadedID = session?.user.id ?? null;
      const ownGeneration = ++generation;
      clearRemote();
      if (!session) {
        setState({ phase: "signed-out", message: "" });
        return;
      }
      setState({ phase: "loading", message: "" });
      // Defer auth API calls until the Supabase auth callback releases its lock.
      setTimeout(() => {
        void accountRequest("/api/state")
          .then((result) => {
            if (!alive || ownGeneration !== generation) return;
            const ownID = session.user.id;
            connectRemote(result.data, result.version, (data, version) =>
              accountRequest("/api/state", "PUT", { data, version }, ownID),
            );
            setState({ phase: "ready", message: "" });
          })
          .catch(() => {
            if (alive && ownGeneration === generation)
              setState({
                phase: "error",
                message:
                  "We couldn't load your account. Retry before making changes.",
              });
          });
      }, 0);
    });
    const warn = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      alive = false;
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", warn);
    };
  }, []);
  async function signOut() {
    if (hasUnsavedChanges())
      throw new Error(
        "Save or export your pending changes before signing out.",
      );
    const { error } = await authClient().auth.signOut();
    if (error) throw new Error("Sign out failed. Please try again.");
    clearRemote();
    setState({ phase: "signed-out", message: "" });
  }
  return (
    <AccountContext.Provider value={{ ...state, refresh, signOut }}>
      {children}
    </AccountContext.Provider>
  );
}
export function AccountGate({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  if (!LIVE_MODE || account.phase === "ready") return children;
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">
        {account.phase === "signed-out"
          ? "Save your travel plans with an account"
          : "Your TripCooker account"}
      </h1>
      <p className="mt-3 text-charcoal-500">
        {account.phase === "loading"
          ? "Loading your saved trips…"
          : account.message ||
            "Sign in to plan your free trip and keep your travel details across devices."}
      </p>
      <div className="mt-5 flex gap-4">
        {account.phase === "error" && AUTH_CONFIGURED && (
          <button
            className="underline"
            onClick={() => void account.refresh().catch(() => {})}
          >
            Retry loading account
          </button>
        )}
        <Link href="/sign-in" className="font-semibold text-ocean-700">
          Sign in / Create account
        </Link>
        <Link href="/" className="text-ocean-700">
          Back to home
        </Link>
      </div>
    </div>
  );
}
