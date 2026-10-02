"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset, resetPassword } from "@/lib/actions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ForgotInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  if (token) {
    return (
      <form
        className="mt-8 flex flex-col gap-3"
        action={(fd) => {
          start(async () => {
            const password = String(fd.get("password") || "");
            const res = await resetPassword(token, password);
            setMessage(res.error || "Password updated. You can log in.");
          });
        }}
      >
        <label className="text-sm font-medium text-ink-muted">
          New password
          <input className="input-field mt-1" name="password" type="password" required minLength={6} />
        </label>
        <button className="btn-primary" disabled={pending} type="submit">
          Reset password
        </button>
        {message && <p className="text-sm text-ink-muted">{message}</p>}
      </form>
    );
  }

  return (
    <form
      className="mt-8 flex flex-col gap-3"
      action={(fd) => {
        start(async () => {
          const email = String(fd.get("email") || "");
          const res = await requestPasswordReset(email);
          setMessage(
            res.devToken
              ? `Dev reset link token: ${res.devToken}`
              : "If that email exists, a reset link was created."
          );
        });
      }}
    >
      <label className="text-sm font-medium text-ink-muted">
        Email
        <input className="input-field mt-1" name="email" type="email" required />
      </label>
      <button className="btn-primary" disabled={pending} type="submit">
        Send reset link
      </button>
      {message && <p className="text-sm text-ink-muted">{message}</p>}
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="font-display text-2xl font-bold">
        Pesu
      </Link>
      <h1 className="mt-8 font-display text-3xl font-semibold">Reset password</h1>
      <Suspense>
        <ForgotInner />
      </Suspense>
    </main>
  );
}
