"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loginUser, loginAsGuest } from "@/lib/actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="font-display text-2xl font-bold text-ink">
        Pesu
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-ink-muted">Continue your Tamil journey.</p>

      <form
        className="mt-8 flex flex-col gap-3"
        action={(fd) => {
          start(async () => {
            const res = await loginUser(fd);
            if (res.error) setError(res.error);
            else router.push("/dashboard");
          });
        }}
      >
        <label className="text-sm font-medium text-ink-muted">
          Email
          <input className="input-field mt-1" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="text-sm font-medium text-ink-muted">
          Password
          <input
            className="input-field mt-1"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-coral">{error}</p>}
        <button className="btn-primary mt-2" disabled={pending} type="submit">
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>

      <button
        type="button"
        className="btn-secondary mt-3"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await loginAsGuest();
            router.push("/onboarding");
          })
        }
      >
        Try as guest
      </button>

      <p className="mt-6 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-mango">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/forgot-password" className="text-ink-faint hover:text-ink-muted">
          Forgot password?
        </Link>
      </p>
    </main>
  );
}
