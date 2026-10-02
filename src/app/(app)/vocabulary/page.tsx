import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AudioButton } from "@/components/learning/AudioButton";

export default async function VocabularyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const words = await prisma.vocabularyItem.findMany({
    where: { status: "published" },
    include: { concept: true },
    orderBy: { romanized: "asc" },
  });

  const conceptMastery = await prisma.userConceptMastery.findMany({
    where: { userId: session.user.id },
  });
  const byConceptId = new Map(conceptMastery.map((m) => [m.conceptId, m]));

  return (
    <main className="px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl font-semibold">Vocabulary</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Words from your course — not a giant dictionary.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {words.map((w) => {
          const m = byConceptId.get(w.conceptId);
          const pct = m ? Math.round(m.overall * 100) : 0;
          return (
            <li
              key={w.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">{w.romanized}</p>
                <p className="text-sm text-ink-muted">{w.english}</p>
                <p className="font-tamil text-xs text-ink-faint" lang="ta">
                  {w.tamilScript}
                </p>
                {m && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Mastery {pct}% · listen {Math.round(m.listening * 100)}%
                  </p>
                )}
              </div>
              <AudioButton ttsText={w.ttsText || w.tamilScript} size="sm" />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
