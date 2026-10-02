"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { cn, parseJsonArray, shuffle } from "@/lib/utils";
import { matchesRomanized } from "@/lib/romanization";
import { PhraseCard } from "@/components/learning/PhraseCard";
import { AudioButton } from "@/components/learning/AudioButton";

export type ExerciseData = {
  id: string;
  type: string;
  order?: number;
  promptRomanized?: string | null;
  promptTamil?: string | null;
  promptEnglish?: string | null;
  promptText?: string | null;
  ttsText?: string | null;
  correctAnswers: string;
  distractors?: string | null;
  tokens?: string | null;
  options?: string | null;
  pairs?: string | null;
  explanation?: string | null;
  hint?: string | null;
  literalMeaning?: string | null;
  formalNote?: string | null;
  conceptKeys: string;
  audioAssetId?: string | null;
};

type Props = {
  exercise: ExerciseData;
  onAnswer: (result: {
    correct: boolean;
    answer: string;
    dimension: string;
  }) => void;
};

function Feedback({
  correct,
  explanation,
}: {
  correct: boolean;
  explanation?: string | null;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm",
        correct ? "bg-success/10 text-success" : "bg-coral/10 text-coral"
      )}
      role="status"
    >
      {correct ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <X className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>
        <p className="font-semibold">{correct ? "Nice!" : "Not quite"}</p>
        {explanation && <p className="mt-0.5 opacity-90">{explanation}</p>}
      </div>
    </div>
  );
}

function ChoiceButton({
  label,
  selected,
  state,
  onClick,
}: {
  label: string;
  selected?: boolean;
  state?: "idle" | "correct" | "wrong";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "correct" || state === "wrong"}
      className={cn(
        "min-h-14 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-medium transition active:scale-[0.99]",
        state === "correct" && "border-success bg-success/10 text-success",
        state === "wrong" && "border-coral bg-coral/10 text-coral",
        state === "idle" && selected && "border-mango bg-mango/10",
        state === "idle" && !selected && "border-border bg-white/70 hover:border-mango/50"
      )}
    >
      {label}
    </button>
  );
}

export function ExercisePlayer({ exercise, onAnswer }: Props) {
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const correctAnswers = parseJsonArray(exercise.correctAnswers);
  const options = useMemo(
    () => shuffle(parseJsonArray(exercise.options)),
    [exercise.options]
  );
  const tokens = useMemo(
    () => shuffle(parseJsonArray(exercise.tokens)),
    [exercise.tokens]
  );
  const pairs = useMemo(() => {
    try {
      return exercise.pairs ? (JSON.parse(exercise.pairs) as { left: string; right: string }[]) : [];
    } catch {
      return [];
    }
  }, [exercise.pairs]);

  const submit = (answer: string, dimension: string, isCorrect: boolean) => {
    if (answered) return;
    setAnswered(true);
    setCorrect(isCorrect);
    setPicked(answer);
    onAnswer({ correct: isCorrect, answer, dimension });
  };

  const checkChoice = (answer: string, dimension: string) => {
    const ok = matchesRomanized(answer, correctAnswers) || correctAnswers.some(
      (c) => softEq(c, answer)
    );
    submit(answer, dimension, ok);
  };

  if (exercise.type === "intro" || exercise.type === "pattern_intro") {
    return (
      <div className="flex flex-col">
        {exercise.promptText && (
          <p className="mb-6 text-center text-sm text-ink-muted">{exercise.promptText}</p>
        )}
        <PhraseCard
          romanized={exercise.promptRomanized || ""}
          english={exercise.promptEnglish || ""}
          tamilScript={exercise.promptTamil}
          ttsText={exercise.ttsText}
          literalMeaning={exercise.literalMeaning}
          formalNote={exercise.formalNote}
          size="hero"
        />
        <button
          type="button"
          className="btn-primary mt-10 w-full"
          onClick={() => submit("continue", "recognize", true)}
        >
          Got it
        </button>
      </div>
    );
  }

  if (
    exercise.type === "tamil_to_english" ||
    exercise.type === "english_to_tamil" ||
    exercise.type === "listening_recognition" ||
    exercise.type === "listening_meaning" ||
    exercise.type === "conversation_response" ||
    exercise.type === "fill_blank" ||
    exercise.type === "find_mistake"
  ) {
    const isListening = exercise.type.startsWith("listening");
    const dimension =
      exercise.type === "listening_recognition" || exercise.type === "listening_meaning"
        ? "listening"
        : exercise.type === "english_to_tamil" || exercise.type === "fill_blank"
          ? "production"
          : exercise.type === "conversation_response"
            ? "conversation"
            : "meaning";

    return (
      <div>
        {exercise.promptText && (
          <p className="mb-4 text-center text-sm text-ink-muted">{exercise.promptText}</p>
        )}
        {isListening ? (
          <div className="mb-8 flex flex-col items-center gap-3">
            <p className="font-display text-xl text-ink">Listen</p>
            <AudioButton ttsText={exercise.ttsText || exercise.promptTamil} size="md" />
          </div>
        ) : exercise.type === "english_to_tamil" ? (
          <p className="mb-8 text-center font-display text-2xl font-semibold text-ink">
            {exercise.promptEnglish}
          </p>
        ) : (
          <div className="mb-8">
            <PhraseCard
              romanized={exercise.promptRomanized || exercise.promptEnglish || ""}
              english={exercise.promptEnglish && exercise.promptRomanized ? exercise.promptEnglish : ""}
              tamilScript={exercise.promptTamil}
              ttsText={exercise.ttsText}
              formalNote={exercise.formalNote}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            let state: "idle" | "correct" | "wrong" = "idle";
            if (answered && picked === opt) state = correct ? "correct" : "wrong";
            else if (answered && correctAnswers.some((c) => softEq(c, opt))) state = "correct";
            return (
              <ChoiceButton
                key={opt}
                label={opt}
                state={state}
                onClick={() => checkChoice(opt, dimension)}
              />
            );
          })}
        </div>
        {answered && <Feedback correct={correct} explanation={exercise.explanation} />}
      </div>
    );
  }

  if (exercise.type === "build_sentence") {
    return (
      <BuildSentence
        exercise={exercise}
        tokens={tokens}
        correctAnswers={correctAnswers}
        onSubmit={(answer, ok) => submit(answer, "production", ok)}
        answered={answered}
        correct={correct}
      />
    );
  }

  if (exercise.type === "word_matching") {
    return (
      <WordMatching
        pairs={pairs}
        promptText={exercise.promptText}
        explanation={exercise.explanation}
        onComplete={(ok) => submit("matched", "recognize", ok)}
        answered={answered}
        correct={correct}
      />
    );
  }

  return (
    <div className="text-center text-ink-muted">
      Unsupported exercise type: {exercise.type}
      <button className="btn-primary mt-4 w-full" onClick={() => submit("skip", "recognize", true)}>
        Continue
      </button>
    </div>
  );
}

function softEq(a: string, b: string) {
  return a.trim().toLowerCase().replace(/\?$/, "") === b.trim().toLowerCase().replace(/\?$/, "");
}

function BuildSentence({
  exercise,
  tokens,
  correctAnswers,
  onSubmit,
  answered,
  correct,
}: {
  exercise: ExerciseData;
  tokens: string[];
  correctAnswers: string[];
  onSubmit: (answer: string, ok: boolean) => void;
  answered: boolean;
  correct: boolean;
}) {
  const [built, setBuilt] = useState<string[]>([]);
  const [used, setUsed] = useState<boolean[]>(() => tokens.map(() => false));

  const add = (idx: number) => {
    if (answered || used[idx]) return;
    setBuilt((b) => [...b, tokens[idx]]);
    setUsed((u) => u.map((v, i) => (i === idx ? true : v)));
  };
  const undo = () => {
    if (answered || built.length === 0) return;
    const last = built[built.length - 1];
    let found = -1;
    for (let i = used.length - 1; i >= 0; i--) {
      if (used[i] && tokens[i] === last) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      setUsed((u) => u.map((v, i) => (i === found ? false : v)));
    }
    setBuilt((b) => b.slice(0, -1));
  };

  const check = () => {
    const answer = built.join(" ");
    const ok = matchesRomanized(answer, correctAnswers);
    onSubmit(answer, ok);
  };

  return (
    <div>
      <p className="mb-2 text-center text-sm text-ink-muted">{exercise.promptText || "Build the sentence"}</p>
      <p className="mb-6 text-center font-display text-2xl font-semibold">{exercise.promptEnglish}</p>
      <div className="mb-4 flex min-h-16 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed border-border bg-white/50 p-3">
        {built.length === 0 && (
          <span className="text-sm text-ink-faint">Tap words below</span>
        )}
        {built.map((w, i) => (
          <span key={`${w}-${i}`} className="rounded-xl bg-mango/15 px-3 py-2 text-sm font-medium text-ink">
            {w}
          </span>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tokens.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            disabled={used[i] || answered}
            onClick={() => add(i)}
            className={cn(
              "rounded-xl border-2 border-border bg-white px-3 py-2 text-sm font-medium disabled:opacity-30"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={undo} disabled={answered}>
          Undo
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={check}
          disabled={answered || built.length === 0}
        >
          Check
        </button>
      </div>
      {answered && <Feedback correct={correct} explanation={exercise.explanation} />}
    </div>
  );
}

function WordMatching({
  pairs,
  promptText,
  explanation,
  onComplete,
  answered,
  correct,
}: {
  pairs: { left: string; right: string }[];
  promptText?: string | null;
  explanation?: string | null;
  onComplete: (ok: boolean) => void;
  answered: boolean;
  correct: boolean;
}) {
  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [pairs]);

  const onLeft = (l: string) => {
    if (answered || matched[l]) return;
    setLeftSel(l);
  };
  const onRight = (r: string) => {
    if (answered || !leftSel) return;
    if (Object.values(matched).includes(r)) return;
    const expected = pairs.find((p) => p.left === leftSel)?.right;
    if (expected === r) {
      const next = { ...matched, [leftSel]: r };
      setMatched(next);
      setLeftSel(null);
      if (Object.keys(next).length === pairs.length) {
        onComplete(true);
      }
    } else {
      setLeftSel(null);
      onComplete(false);
    }
  };

  return (
    <div>
      <p className="mb-6 text-center text-sm text-ink-muted">{promptText || "Match the pairs"}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {pairs.map((p) => (
            <button
              key={p.left}
              type="button"
              disabled={!!matched[p.left] || answered}
              onClick={() => onLeft(p.left)}
              className={cn(
                "min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-medium",
                matched[p.left] && "border-success bg-success/10 text-success",
                leftSel === p.left && "border-mango bg-mango/10",
                !matched[p.left] && leftSel !== p.left && "border-border bg-white"
              )}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rights.map((r) => (
            <button
              key={r}
              type="button"
              disabled={Object.values(matched).includes(r) || answered}
              onClick={() => onRight(r)}
              className={cn(
                "min-h-12 rounded-xl border-2 px-3 py-2 text-sm font-medium",
                Object.values(matched).includes(r) && "border-success bg-success/10 text-success",
                !Object.values(matched).includes(r) && "border-border bg-white"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {answered && <Feedback correct={correct} explanation={explanation} />}
    </div>
  );
}
