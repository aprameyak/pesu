"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registerUser } from "@/lib/actions";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="font-display text-2xl font-bold text-ink">
        Pesu
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-ink-muted">Progress saves across devices.</p>

      <form
        className="mt-8 flex flex-col gap-3"
        action={(fd) => {
          start(async () => {
            const res = await registerUser(fd);
            if (res.error) setError(res.error);
            else router.push("/onboarding");
          });
        }}
      >
        <label className="text-sm font-medium text-ink-muted">
          Name
          <input className="input-field mt-1" name="name" type="text" autoComplete="name" />
        </label>
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
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="text-sm text-coral">{error}</p>}
        <button className="btn-primary mt-2" disabled={pending} type="submit">
          {pending ? "Creating…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already learning?{" "}
        <Link href="/login" className="font-semibold text-mango">
          Log in
        </Link>
      </p>
    </main>
  );
}
