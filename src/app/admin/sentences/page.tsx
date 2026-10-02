import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminSentencesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") redirect("/dashboard");

  const sentences = await prisma.sentence.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin" className="text-sm text-ink-muted">
        ← Admin
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">Sentences</h1>
      <ul className="mt-6 space-y-3">
        {sentences.map((s) => (
          <li key={s.id} className="rounded-2xl border border-border bg-white p-4">
            <p className="font-display font-semibold">{s.romanizedTamil}</p>
            <p className="text-sm text-ink-muted">{s.english}</p>
            <p className="font-tamil text-sm" lang="ta">
              {s.tamilScript}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {s.register} · {s.status}
              {s.literalMeaning ? ` · lit: ${s.literalMeaning}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
