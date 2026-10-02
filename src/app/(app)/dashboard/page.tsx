import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getWeakReviewCount } from "@/lib/mastery";
import { Flame, Sparkles, BookOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.onboardingDone) redirect("/onboarding");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  const continueLesson =
    (await prisma.userLessonProgress.findFirst({
      where: {
        userId: user.id,
        status: { in: ["available", "in_progress"] },
        lesson: { published: true },
      },
      include: { lesson: { include: { unit: true } } },
      orderBy: [{ lesson: { unit: { order: "asc" } } }, { lesson: { order: "asc" } }],
    })) ||
    (await prisma.userLessonProgress.findFirst({
      where: { userId: user.id, status: "completed", lesson: { published: true } },
      include: { lesson: { include: { unit: true } } },
      orderBy: { completedAt: "desc" },
    }));

  let fallbackLesson = null;
  if (!continueLesson) {
    fallbackLesson = await prisma.lesson.findFirst({
      where: { published: true, unit: { published: true } },
      include: { unit: true },
      orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
    });
    if (fallbackLesson) {
      await prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId: user.id, lessonId: fallbackLesson.id } },
        create: { userId: user.id, lessonId: fallbackLesson.id, status: "available" },
        update: {},
      });
    }
  }

  const lesson = continueLesson?.lesson || fallbackLesson;
  const reviewCount = await getWeakReviewCount(user.id);
  const dailyPct = Math.min(100, Math.round((user.dailyXpEarned / user.dailyGoalXp) * 100));

  return (
    <main className="px-5 pt-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">Vanakkam{user.name ? `, ${user.name}` : ""}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Continue learning</h1>
        </div>
        {user.role === "admin" && (
          <Link href="/admin" className="text-xs font-semibold text-mango">
            Admin
          </Link>
        )}
      </div>

      {lesson ? (
        <div className="mt-6 rounded-3xl border border-border bg-white/80 p-5 shadow-sm shadow-mango/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-mango">
            {lesson.unit.title}
          </p>
          <p className="mt-1 font-display text-xl font-semibold">{lesson.title}</p>
          <p className="mt-1 text-sm text-ink-muted">{lesson.description}</p>
          <Link href={`/lesson/${lesson.id}`} className="btn-primary mt-5 inline-flex w-full">
            Continue
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-border bg-white/80 p-5">
          <p className="text-ink-muted">No lessons available yet.</p>
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-border bg-white/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold">Quick review</p>
            <p className="text-sm text-ink-muted">
              {reviewCount > 0 ? `${reviewCount} skills need practice` : "You're caught up — nice."}
            </p>
          </div>
          <Link href="/review" className="btn-secondary !min-h-10 !px-4 !text-sm">
            Review
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="h-4 w-4 text-mango" />} label="Streak" value={`${user.currentStreak}d`} />
        <Stat icon={<Sparkles className="h-4 w-4 text-teal" />} label="XP" value={`${user.xp}`} />
        <Stat icon={<BookOpen className="h-4 w-4 text-ink-muted" />} label="Words" value={`${user.wordsLearned}`} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs font-medium text-ink-muted">
          <span>Daily goal</span>
          <span>
            {user.dailyXpEarned}/{user.dailyGoalXp} XP
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-mango transition-all" style={{ width: `${dailyPct}%` }} />
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/70 px-3 py-3 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
      <p className="text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}
