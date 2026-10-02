"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExercisePlayer, type ExerciseData } from "@/components/exercises/ExercisePlayer";
import { completeLesson, startLesson, submitExerciseAnswer } from "@/lib/actions";
import type { MasteryDimension } from "@/lib/mastery";
import { X } from "lucide-react";

type Props = {
  lesson: {
    id: string;
    title: string;
    xpReward: number;
    unit: { title: string };
    exercises: ExerciseData[];
  };
};

export function LessonRunner({ lesson }: Props) {
  const router = useRouter();
  const exercises = useMemo(
    () => [...lesson.exercises].sort((a, b) => (a as { order?: number }).order! - (b as { order?: number }).order!),
    [lesson.exercises]
  );
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{ xp: number; accuracy: number; perfect: boolean } | null>(null);
  const [pending, start] = useTransition();
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    startLesson(lesson.id);
  }, [lesson.id]);

  const exercise = exercises[index];
  const progress = exercises.length ? ((index + (waiting || finished ? 1 : 0)) / exercises.length) * 100 : 0;

  const advance = () => {
    setWaiting(false);
    if (index + 1 >= exercises.length) {
      start(async () => {
        const res = await completeLesson({
          lessonId: lesson.id,
          correctCount,
          totalCount: Math.max(totalAnswered, exercises.length),
        });
        if (res.ok) {
          setResult({
            xp: res.xp || 0,
            accuracy: res.accuracy || 0,
            perfect: Boolean(res.perfect),
          });
          setFinished(true);
        }
      });
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (finished && result) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-mango">Lesson complete</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{lesson.title}</h1>
        <p className="mt-4 text-ink-muted">
          +{result.xp} XP · {Math.round(result.accuracy * 100)}% accuracy
          {result.perfect ? " · Perfect!" : ""}
        </p>
        <Link href="/dashboard" className="btn-primary mt-8">
          Back to dashboard
        </Link>
        <Link href="/learn" className="btn-secondary mt-3">
          View path
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-10 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white"
          aria-label="Close lesson"
        >
          <X className="h-4 w-4" />
        </Link>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-mango transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {lesson.unit.title}
      </p>
      <p className="mb-6 text-sm text-ink-muted">
        {index + 1} / {exercises.length}
      </p>

      {exercise && (
        <ExercisePlayer
          key={exercise.id}
          exercise={exercise}
          onAnswer={({ correct, answer, dimension }) => {
            start(async () => {
              await submitExerciseAnswer({
                exerciseId: exercise.id,
                lessonId: lesson.id,
                correct,
                answer,
                dimension: dimension as MasteryDimension,
              });
              setTotalAnswered((t) => t + 1);
              if (correct) setCorrectCount((c) => c + 1);
              setWaiting(true);
            });
          }}
        />
      )}

      {waiting && (
        <button type="button" className="btn-primary mt-6 w-full" onClick={advance} disabled={pending}>
          Continue
        </button>
      )}
    </main>
  );
}
