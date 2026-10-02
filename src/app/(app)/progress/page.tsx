import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutUser } from "@/lib/actions";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const completed = await prisma.userLessonProgress.count({
    where: { userId: user.id, status: "completed" },
  });
  const concepts = await prisma.userConceptMastery.findMany({
    where: { userId: user.id },
    include: { concept: true },
    orderBy: { overall: "asc" },
    take: 8,
  });
  const mastered = await prisma.userConceptMastery.count({
    where: { userId: user.id, overall: { gte: 0.8 } },
  });
  const achievements = await prisma.userAchievement.findMany({
    where: { userId: user.id },
    include: { achievement: true },
  });

  const avgListening =
    concepts.length === 0
      ? 0
      : concepts.reduce((s, c) => s + c.listening, 0) / concepts.length;
  const avgRecognize =
    concepts.length === 0
      ? 0
      : concepts.reduce((s, c) => s + c.recognize, 0) / concepts.length;

  return (
    <main className="px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl font-semibold">Progress</h1>
      <p className="mt-1 text-sm text-ink-muted">Level {user.level} · {user.xp} XP</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Tile label="Lessons" value={String(completed)} />
        <Tile label="Words learned" value={String(user.wordsLearned)} />
        <Tile label="Patterns strong" value={String(mastered)} />
        <Tile label="Streak" value={`${user.currentStreak} days`} />
        <Tile label="Listening" value={`${Math.round(avgListening * 100)}%`} />
        <Tile label="Romanized" value={`${Math.round(avgRecognize * 100)}%`} />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Weak concepts</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {concepts.filter((c) => c.overall < 0.7).map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-border bg-white/60 px-3 py-2 text-sm"
          >
            <span className="font-medium">{c.concept.title}</span>
            <span className="text-ink-faint"> · {Math.round(c.overall * 100)}%</span>
          </li>
        ))}
        {concepts.every((c) => c.overall >= 0.7) && (
          <li className="text-sm text-ink-muted">No weak concepts yet — keep going.</li>
        )}
      </ul>

      <h2 className="mt-8 font-display text-lg font-semibold">Achievements</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {achievements.length === 0 && (
          <li className="text-sm text-ink-muted">Complete lessons to unlock achievements.</li>
        )}
        {achievements.map((a) => (
          <li key={a.id} className="rounded-xl border border-border bg-white/70 px-3 py-2 text-sm">
            <span className="font-medium">{a.achievement.title}</span>
            <span className="text-ink-faint"> — {a.achievement.description}</span>
          </li>
        ))}
      </ul>

      <form
        className="mt-10"
        action={async () => {
          "use server";
          await logoutUser();
          redirect("/login");
        }}
      >
        <button type="submit" className="btn-secondary w-full">
          Log out
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-faint">
        <Link href="/vocabulary">Browse vocabulary</Link>
      </p>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/70 px-4 py-3">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="text-xs text-ink-faint">{label}</p>
    </div>
  );
}
