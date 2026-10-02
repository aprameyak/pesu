"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboarding } from "@/lib/actions";
import { cn } from "@/lib/utils";

const LEVELS = [
  {
    id: "none",
    title: "I know nothing",
    blurb: "Complete beginner — start from Survival Tamil.",
  },
  {
    id: "few_words",
    title: "I know a few words",
    blurb: "Scattered words, but sentences feel hard.",
  },
  {
    id: "understand_some",
    title: "I understand some Tamil but can't speak much",
    blurb: "Heritage path — we'll skip the absolute basics.",
  },
  {
    id: "understand_conversations",
    title: "I understand conversations but struggle to respond",
    blurb: "Place you further in — focus on building replies.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [level, setLevel] = useState<string>("none");
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-10">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-mango">
        Welcome
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink">
        How much Tamil do you already know?
      </h1>
      <p className="mt-3 text-ink-muted">
        We teach spoken Tamil with Romanized spelling first. Script is optional exposure — never a gate.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLevel(l.id)}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition",
              level === l.id ? "border-mango bg-mango/10" : "border-border bg-white/70"
            )}
          >
            <p className="font-semibold text-ink">{l.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{l.blurb}</p>
          </button>
        ))}
      </div>

      <label className="mt-6 text-sm font-medium text-ink-muted">
        What should we call you? (optional)
        <input
          className="input-field mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <button
        type="button"
        className="btn-primary mt-8 w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await completeOnboarding({ tamilLevel: level, name: name || undefined });
            router.push("/dashboard");
          })
        }
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </main>
  );
}
