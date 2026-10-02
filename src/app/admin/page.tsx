import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminActions } from "./AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") redirect("/dashboard");

  const units = await prisma.unit.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { _count: { select: { exercises: true } } },
      },
    },
  });
  const vocabCount = await prisma.vocabularyItem.count();
  const sentenceCount = await prisma.sentence.count();
  const dialogueCount = await prisma.dialogue.count();
  const audioAssets = await prisma.audioAsset.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  const reviews = await prisma.contentReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-mango">Admin</p>
          <h1 className="font-display text-2xl font-semibold">Curriculum</h1>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-ink-muted">
          ← App
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-border bg-white p-3">
          <p className="font-display text-xl font-semibold">{vocabCount}</p>
          <p className="text-xs text-ink-faint">Vocabulary</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-3">
          <p className="font-display text-xl font-semibold">{sentenceCount}</p>
          <p className="text-xs text-ink-faint">Sentences</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-3">
          <p className="font-display text-xl font-semibold">{dialogueCount}</p>
          <p className="text-xs text-ink-faint">Dialogues</p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold">Units & lessons</h2>
      <div className="mt-4 flex flex-col gap-4">
        {units.map((unit) => (
          <div key={unit.id} className="rounded-2xl border border-border bg-white/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {unit.stage}. {unit.title}
                </p>
                <p className="text-xs text-ink-faint">
                  status: {unit.status} · {unit.published ? "published" : "unpublished"}
                </p>
              </div>
              <AdminActions entityType="unit" entityId={unit.id} status={unit.status} />
            </div>
            <ul className="mt-3 space-y-2 border-t border-border pt-3">
              {unit.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <Link href={`/lesson/${lesson.id}`} className="font-medium hover:text-mango">
                      {lesson.title}
                    </Link>
                    <span className="text-ink-faint">
                      {" "}
                      · {lesson._count.exercises} exercises · {lesson.status}
                    </span>
                  </div>
                  <AdminActions entityType="lesson" entityId={lesson.id} status={lesson.status} />
                </li>
              ))}
              {unit.lessons.length === 0 && (
                <li className="text-xs text-ink-faint">No lessons yet (placeholder unit)</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold">Audio cache</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Sarvam Bulbul v3 · ta-IN · generated once, reused for all learners
      </p>
      <div className="mt-4">
        <AdminActions generate />
        <ul className="mt-4 space-y-2">
          {audioAssets.length === 0 && (
            <li className="text-sm text-ink-muted">
              No audio generated yet. Set SARVAM_API_KEY and generate.
            </li>
          )}
          {audioAssets.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-tamil" lang="ta">
                  {a.sourceText}
                </p>
                <p className="text-xs text-ink-faint">
                  {a.status} · {a.model} · {a.voice}
                  {a.generatedAt ? ` · ${a.generatedAt.toISOString().slice(0, 10)}` : ""}
                </p>
              </div>
              <AdminActions regenId={a.id} />
            </li>
          ))}
        </ul>
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold">Content review log</h2>
      <ul className="mt-3 space-y-2">
        {reviews.length === 0 && <li className="text-sm text-ink-muted">No reviews yet.</li>}
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-white/60 px-3 py-2 text-sm">
            {r.entityType} {r.entityId.slice(0, 8)}… · {r.status}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/vocabulary" className="font-semibold text-mango">
          Vocabulary
        </Link>
        <Link href="/admin/sentences" className="font-semibold text-mango">
          Sentences
        </Link>
        <Link href="/admin/dialogues" className="font-semibold text-mango">
          Dialogues
        </Link>
      </div>
    </main>
  );
}
