import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ReviewClient } from "./ReviewClient";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const due = await prisma.reviewQueueItem.findMany({
    where: { userId: session.user.id, dueAt: { lte: new Date() } },
    include: { concept: { include: { vocabulary: true } } },
    orderBy: { priority: "desc" },
    take: 12,
  });

  const items = due.map((d) => ({
    conceptKey: d.concept.key,
    title: d.concept.title,
    romanized: d.concept.vocabulary?.romanized || d.concept.title,
    tamilScript: d.concept.vocabulary?.tamilScript || "",
    english: d.concept.vocabulary?.english || d.concept.description || "",
    ttsText: d.concept.vocabulary?.ttsText || d.concept.vocabulary?.tamilScript || "",
    reason: d.reason,
  }));

  let fallback = items;
  if (!fallback.length) {
    const vocab = await prisma.vocabularyItem.findMany({
      where: { status: "published" },
      take: 6,
      orderBy: { createdAt: "asc" },
    });
    fallback = vocab.map((v) => ({
      conceptKey: `vocab-fallback:${v.id}`,
      title: v.romanized,
      romanized: v.romanized,
      tamilScript: v.tamilScript,
      english: v.english,
      ttsText: v.ttsText || v.tamilScript,
      reason: "practice",
    }));
  }

  return (
    <main className="px-5 pt-8">
      <h1 className="font-display text-2xl font-semibold">Review weak skills</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Personalized from mistakes, low mastery, and spaced recall.
      </p>
      <ReviewClient items={fallback} />
    </main>
  );
}
