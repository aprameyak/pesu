"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    prompt: "Vanakkam",
    tamil: "வணக்கம்",
    options: ["Hello", "Thank you", "Where?", "I don't know"],
    answer: "Hello",
  },
  {
    prompt: "Nandri",
    tamil: "நன்றி",
    options: ["Please", "Thank you", "Yes", "Who?"],
    answer: "Thank you",
  },
  {
    prompt: "Puriyala",
    tamil: "புரியல",
    options: ["I understand", "I don't understand", "Okay", "What?"],
    answer: "I don't understand",
  },
];

export default function PlacementPage() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[i];

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10 text-center">
        <h1 className="font-display text-3xl font-semibold">Placement complete</h1>
        <p className="mt-3 text-ink-muted">
          You got {score}/{QUESTIONS.length}. Your path is ready — jump into lessons that stretch you.
        </p>
        <button className="btn-primary mt-8" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-10">
      <p className="text-sm font-semibold text-mango">
        Quick placement · {i + 1}/{QUESTIONS.length}
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold">{q.prompt}</h1>
      <p className="mt-2 font-tamil text-ink-faint" lang="ta">
        {q.tamil}
      </p>
      <p className="mt-2 text-sm text-ink-muted">What does this mean?</p>
      <div className="mt-8 flex flex-col gap-3">
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={cn("min-h-14 rounded-2xl border-2 border-border bg-white px-4 py-3 text-left font-medium")}
            onClick={() => {
              const nextScore = score + (opt === q.answer ? 1 : 0);
              setScore(nextScore);
              if (i + 1 >= QUESTIONS.length) {
                setDone(true);
                fetch("/api/analytics", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event: "placement_completed",
                    payload: { score: nextScore },
                  }),
                });
              } else setI(i + 1);
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 text-sm text-ink-faint"
        onClick={() => router.push("/dashboard")}
      >
        Skip placement
      </button>
    </main>
  );
}
