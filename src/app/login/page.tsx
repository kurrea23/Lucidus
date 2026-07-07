"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { getSupabase, isCloudEnabled } from "@/lib/supabase/client";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError("");
    setNotice("");

    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (!data.session) {
        setNotice(
          "Almost there — check your email for a confirmation link, then come back and sign in."
        );
        setMode("signin");
        return;
      }
      router.push("/dashboard");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
    }
  }

  if (!isCloudEnabled()) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card className="p-8">
          <CloudOff className="mx-auto size-8 text-charcoal-400" />
          <h1 className="mt-3 text-lg font-bold">Accounts aren&apos;t set up here</h1>
          <p className="mt-2 text-sm text-charcoal-500">
            This deployment runs in local demo mode — your trips save in this
            browser. Cloud accounts activate once Supabase keys are configured.
          </p>
          <Link href="/dashboard" className="mt-5 inline-block">
            <Button>Continue in demo mode</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <Card className="p-6">
        <div className="mb-5 flex rounded-xl border border-sand-200 bg-sand-50 p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                mode === m ? "bg-ocean-700 text-white" : "text-charcoal-500 hover:text-charcoal-900"
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <h1 className="text-xl font-bold">
          {mode === "signin" ? "Welcome back" : "Save trips to your account"}
        </h1>
        <p className="mt-1 text-sm text-charcoal-500">
          {mode === "signin"
            ? "Your trips follow you on any device."
            : "Any trips you cooked in demo mode come with you."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-ocean-50 px-3 py-2 text-sm font-medium text-ocean-800">
              {notice}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-charcoal-400">
          Or{" "}
          <Link href="/dashboard" className="text-ocean-700 hover:underline">
            keep using demo mode
          </Link>{" "}
          — trips stay in this browser only.
        </p>
      </Card>
    </div>
  );
}
