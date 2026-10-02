import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Check, Lock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LearnPathPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const course = await prisma.course.findFirst({
    where: { published: true },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { published: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  const progress = await prisma.userLessonProgress.findMany({
    where: { userId: session.user.id },
  });
  const byLesson = new Map(progress.map((p) => [p.lessonId, p]));

  return (
    <main className="px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl font-semibold">Learning path</h1>
      <p className="mt-1 text-sm text-ink-muted">Spoken Tamil · Romanized first</p>

      <div className="relative mt-8 flex flex-col gap-8">
        <div className="absolute left-[1.15rem] top-3 bottom-3 w-0.5 bg-border" aria-hidden />

        {course?.units
          .filter((unit) => unit.published && unit.lessons.length > 0)
          .map((unit) => (
          <section key={unit.id} className="relative">
            <div className="mb-4 flex items-start gap-3">
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                  "border-mango bg-mango text-white"
                )}
              >
                {unit.stage}
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">{unit.title}</h2>
                <p className="text-sm text-ink-muted">{unit.description}</p>
              </div>
            </div>

            <ul className="ml-5 flex flex-col gap-2 border-l-2 border-transparent pl-8">
              {unit.lessons
                .filter((l) => l.published)
                .map((lesson) => {
                  const p = byLesson.get(lesson.id);
                  const status = p?.status || "locked";
                  const unlocked = status === "available" || status === "in_progress" || status === "completed";
                  return (
                    <li key={lesson.id}>
                      {unlocked ? (
                        <Link
                          href={`/lesson/${lesson.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3"
                        >
                          {status === "completed" ? (
                            <Check className="h-5 w-5 text-success" />
                          ) : (
                            <Circle className="h-5 w-5 text-mango" />
                          )}
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-ink-faint">~{lesson.estimatedMin} min</p>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/40 px-4 py-3 opacity-60">
                          <Lock className="h-5 w-5 text-ink-faint" />
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-ink-faint">Locked</p>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
