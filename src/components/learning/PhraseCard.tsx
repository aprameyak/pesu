"use client";

import { AudioButton } from "./AudioButton";
import { cn } from "@/lib/utils";

type PhraseCardProps = {
  romanized: string;
  english: string;
  tamilScript?: string | null;
  ttsText?: string | null;
  audioUrl?: string | null;
  literalMeaning?: string | null;
  formalNote?: string | null;
  scriptVisibility?: "always" | "smaller" | "hide";
  className?: string;
  size?: "hero" | "default";
};

export function PhraseCard({
  romanized,
  english,
  tamilScript,
  ttsText,
  audioUrl,
  literalMeaning,
  formalNote,
  scriptVisibility = "smaller",
  className,
  size = "default",
}: PhraseCardProps) {
  const showScript = scriptVisibility !== "hide" && tamilScript;
  const scriptClass =
    scriptVisibility === "always"
      ? "text-lg text-ink-muted"
      : "text-sm text-ink-faint";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center",
        className
      )}
    >
      <p
        className={cn(
          "font-display font-semibold tracking-tight text-ink",
          size === "hero" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
        )}
      >
        {romanized}
      </p>
      <p className="mt-2 text-base text-ink-muted sm:text-lg">{english}</p>
      {showScript && (
        <p className={cn("mt-2 font-tamil", scriptClass)} lang="ta">
          {tamilScript}
        </p>
      )}
      {literalMeaning && (
        <p className="mt-2 text-xs italic text-ink-faint">
          Literally: {literalMeaning}
        </p>
      )}
      {formalNote && (
        <details className="mt-3 text-left text-xs text-ink-faint">
          <summary className="cursor-pointer select-none hover:text-ink-muted">
            Formal / written Tamil
          </summary>
          <p className="mt-1 pl-1">{formalNote}</p>
        </details>
      )}
      {(ttsText || audioUrl) && (
        <div className="mt-4">
          <AudioButton ttsText={ttsText || tamilScript} audioUrl={audioUrl} />
        </div>
      )}
    </div>
  );
}
