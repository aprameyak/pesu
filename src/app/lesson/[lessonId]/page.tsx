import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { LessonRunner } from "@/components/learning/LessonRunner";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: true,
      exercises: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson || !lesson.published) notFound();

  return (
    <LessonRunner
      lesson={{
        id: lesson.id,
        title: lesson.title,
        xpReward: lesson.xpReward,
        unit: { title: lesson.unit.title },
        exercises: lesson.exercises.map((e) => ({
          id: e.id,
          type: e.type,
          promptRomanized: e.promptRomanized,
          promptTamil: e.promptTamil,
          promptEnglish: e.promptEnglish,
          promptText: e.promptText,
          ttsText: e.ttsText,
          correctAnswers: e.correctAnswers,
          tokens: e.tokens,
          options: e.options,
          pairs: e.pairs,
          explanation: e.explanation,
          literalMeaning: e.literalMeaning,
          formalNote: e.formalNote,
          conceptKeys: e.conceptKeys,
          audioAssetId: e.audioAssetId,
          order: e.order,
        })),
      }}
    />
  );
}
