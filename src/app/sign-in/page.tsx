"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_CONFIGURED, LIVE_MODE } from "@/lib/app-config";
import { authClient } from "@/lib/auth-client";
import { useAccount } from "@/components/account-provider";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
export default function SignInPage() {
  const router = useRouter();
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = sent
        ? await authClient().auth.verifyOtp({
            email: email.trim(),
            token: code.trim(),
            type: "email",
          })
        : await authClient().auth.signInWithOtp({ email: email.trim() });
      if (result.error)
        throw new Error(
          sent
            ? "That code could not be verified. Try again or request a new code."
            : "We couldn't send a sign-in code. Try again shortly.",
        );
      if (sent) router.push("/dashboard");
      else {
        setSent(true);
        setMessage(
          "Check your inbox for your sign-in code. It also creates your free account if needed.",
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
    <main className="mx-auto max-w-md px-4 py-12">
      <Link href="/" className="font-bold text-ocean-700">
        TripCooker
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Your next trip starts here.</h1>
      <p className="mt-3 text-charcoal-500">
        Sign in with an email code. One active trip is free.
      </p>
      {!LIVE_MODE ? (
        <p className="mt-6">
          This is a browser demo.{" "}
          <Link className="underline" href="/dashboard">
            Open the demo
          </Link>
          .
        </p>
      ) : !AUTH_CONFIGURED ? (
        <p className="mt-6" role="status">
          Accounts are not open yet. Please check back soon.
        </p>
      ) : account.phase === "ready" ? (
        <Link href="/dashboard" className="mt-6 inline-block underline">
          Open my dashboard
        </Link>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={sent}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {sent && (
            <div>
              <Label htmlFor="login-code">Sign-in code</Label>
              <Input
                id="login-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6,8}"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          )}
          {!sent && <p className="text-xs leading-5 text-charcoal-500">By requesting a code, you confirm you are 18 or older and agree to the <Link href="/terms" className="underline">Terms</Link>. Read our <Link href="/privacy" className="underline">Privacy policy</Link> to learn how your account and travel data are used.</p>}
          <Button type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : sent
                ? "Verify & sign in"
                : "Send sign-in code"}
          </Button>
          {sent && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setCode("");
              }}
            >
              Use another email / Request a new code
            </Button>
          )}
          <p role="status" className="text-sm text-charcoal-600">
            {message}
          </p>
        </form>
      )}
    </main>
    <SiteFooter />
    </>
  );
}
