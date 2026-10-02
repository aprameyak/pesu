import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminVocabularyPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") redirect("/dashboard");

  const words = await prisma.vocabularyItem.findMany({
    include: { concept: true },
    orderBy: { romanized: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin" className="text-sm text-ink-muted">
        ← Admin
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">Vocabulary</h1>
      <p className="mt-1 text-sm text-ink-muted">Read-only browse of seeded words.</p>
      <ul className="mt-6 space-y-3">
        {words.map((w) => (
          <li key={w.id} className="rounded-2xl border border-border bg-white p-4">
            <p className="font-display text-lg font-semibold">{w.romanized}</p>
            <p className="text-sm text-ink-muted">{w.english}</p>
            <p className="font-tamil text-sm" lang="ta">
              {w.tamilScript}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {w.status} · {w.partOfSpeech} · {w.category}
              {w.formalEquivalent ? ` · formal: ${w.formalEquivalent}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
