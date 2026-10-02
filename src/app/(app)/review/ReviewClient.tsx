"use client";

import { useState } from "react";
import { PhraseCard } from "@/components/learning/PhraseCard";
import { cn } from "@/lib/utils";

type Item = {
  conceptKey: string;
  title: string;
  romanized: string;
  tamilScript: string;
  english: string;
  ttsText: string;
  reason: string | null;
};

export function ReviewClient({ items }: { items: Item[] }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  if (!items.length) {
    return <p className="mt-8 text-ink-muted">Nothing due — enjoy the win.</p>;
  }

  if (done) {
    return (
      <div className="mt-10 text-center">
        <p className="font-display text-2xl font-semibold">Review complete</p>
        <p className="mt-2 text-ink-muted">Come back tomorrow for another pass.</p>
      </div>
    );
  }

  const item = items[i];

  return (
    <div className="mt-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {i + 1} / {items.length}
        {item.reason ? ` · ${item.reason}` : ""}
      </p>
      <PhraseCard
        romanized={item.romanized}
        english={revealed ? item.english : "Tap to reveal meaning"}
        tamilScript={item.tamilScript}
        ttsText={item.ttsText}
        size="hero"
      />
      {!revealed ? (
        <button type="button" className="btn-secondary mt-8 w-full" onClick={() => setRevealed(true)}>
          Reveal
        </button>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            className={cn("btn-secondary")}
            onClick={() => {
              fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "review_completed",
                  payload: { conceptKey: item.conceptKey, remembered: false },
                }),
              });
              if (i + 1 >= items.length) setDone(true);
              else {
                setI(i + 1);
                setRevealed(false);
              }
            }}
          >
            Again
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "review_completed",
                  payload: { conceptKey: item.conceptKey, remembered: true },
                }),
              });
              if (i + 1 >= items.length) setDone(true);
              else {
                setI(i + 1);
                setRevealed(false);
              }
            }}
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
