import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDialoguesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") redirect("/dashboard");

  const dialogues = await prisma.dialogue.findMany({
    include: { lines: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin" className="text-sm text-ink-muted">
        ← Admin
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">Dialogues</h1>
      <div className="mt-6 space-y-6">
        {dialogues.map((d) => (
          <article key={d.id} className="rounded-2xl border border-border bg-white p-4">
            <h2 className="font-display text-lg font-semibold">{d.title}</h2>
            <p className="text-sm text-ink-muted">{d.scenario}</p>
            <ul className="mt-3 space-y-2">
              {d.lines.map((line) => (
                <li key={line.id} className="rounded-xl bg-surface-2/80 px-3 py-2 text-sm">
                  <span className="font-semibold text-mango">{line.speaker}: </span>
                  <span className="font-display font-medium">{line.romanizedTamil}</span>
                  <span className="text-ink-muted"> — {line.english}</span>
                  <p className="font-tamil text-xs text-ink-faint" lang="ta">
                    {line.tamilScript}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
