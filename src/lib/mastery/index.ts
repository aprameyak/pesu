import { prisma } from "@/lib/db";
import { todayISO, levelFromXp } from "@/lib/utils";

export type MasteryDimension =
  | "recognize"
  | "meaning"
  | "production"
  | "conversation"
  | "listening";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function overallFromDims(m: {
  recognize: number;
  meaning: number;
  production: number;
  conversation: number;
  listening: number;
}) {
  return (
    m.recognize * 0.2 +
    m.meaning * 0.25 +
    m.production * 0.25 +
    m.conversation * 0.15 +
    m.listening * 0.15
  );
}

function nextInterval(ease: number, interval: number, quality: number) {
  if (quality < 0.6) return { intervalDays: 0.25, easeFactor: Math.max(1.3, ease - 0.2) };
  const newEase = Math.max(1.3, ease + (0.1 - (1 - quality) * (0.08 + (1 - quality) * 0.02)));
  const newInterval = interval <= 0 ? 1 : interval < 1 ? 1 : interval * newEase;
  return { intervalDays: Math.min(30, newInterval), easeFactor: newEase };
}

export async function recordConceptAttempt(params: {
  userId: string;
  conceptKey: string;
  correct: boolean;
  dimension: MasteryDimension;
}) {
  const concept = await prisma.concept.findUnique({ where: { key: params.conceptKey } });
  if (!concept) return null;

  const existing = await prisma.userConceptMastery.findUnique({
    where: { userId_conceptId: { userId: params.userId, conceptId: concept.id } },
  });

  const delta = params.correct ? 0.12 : -0.08;
  const base = {
    recognize: existing?.recognize ?? 0,
    meaning: existing?.meaning ?? 0,
    production: existing?.production ?? 0,
    conversation: existing?.conversation ?? 0,
    listening: existing?.listening ?? 0,
  };
  base[params.dimension] = clamp01(base[params.dimension] + delta);
  const overall = overallFromDims(base);

  const quality = params.correct ? 0.9 : 0.3;
  const { intervalDays, easeFactor } = nextInterval(
    existing?.easeFactor ?? 2.5,
    existing?.intervalDays ?? 0,
    quality
  );
  const nextReviewAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

  const mastery = await prisma.userConceptMastery.upsert({
    where: { userId_conceptId: { userId: params.userId, conceptId: concept.id } },
    create: {
      userId: params.userId,
      conceptId: concept.id,
      ...base,
      overall,
      exposures: 1,
      correctCount: params.correct ? 1 : 0,
      incorrectCount: params.correct ? 0 : 1,
      streak: params.correct ? 1 : 0,
      lastSeenAt: new Date(),
      nextReviewAt,
      easeFactor,
      intervalDays,
    },
    update: {
      ...base,
      overall,
      exposures: { increment: 1 },
      correctCount: params.correct ? { increment: 1 } : undefined,
      incorrectCount: params.correct ? undefined : { increment: 1 },
      streak: params.correct ? { increment: 1 } : 0,
      lastSeenAt: new Date(),
      nextReviewAt,
      easeFactor,
      intervalDays,
    },
  });

  if (!params.correct || overall < 0.7) {
    await prisma.reviewQueueItem.upsert({
      where: { userId_conceptId: { userId: params.userId, conceptId: concept.id } },
      create: {
        userId: params.userId,
        conceptId: concept.id,
        priority: params.correct ? 0.5 : 1.5,
        reason: params.correct ? "spaced" : "mistake",
        dueAt: nextReviewAt,
      },
      update: {
        priority: params.correct ? 0.5 : 1.5,
        reason: params.correct ? "spaced" : "mistake",
        dueAt: nextReviewAt,
      },
    });
  } else if (overall >= 0.85) {
    await prisma.reviewQueueItem.deleteMany({
      where: { userId: params.userId, conceptId: concept.id },
    });
  }

  return mastery;
}

export async function awardXp(userId: string, amount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const today = todayISO();
  let currentStreak = user.currentStreak;
  let longestStreak = user.longestStreak;
  let dailyXpEarned = user.dailyXpEarned;

  if (user.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yIso = yesterday.toISOString().slice(0, 10);
    currentStreak = user.lastActiveDate === yIso ? user.currentStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    dailyXpEarned = 0;
  }

  dailyXpEarned += amount;
  const xp = user.xp + amount;
  const level = levelFromXp(xp);

  return prisma.user.update({
    where: { id: userId },
    data: {
      xp,
      level,
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      dailyXpEarned,
    },
  });
}

export async function unlockNextLesson(userId: string, completedLessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: completedLessonId },
    include: { unit: { include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  if (!lesson) return;

  const siblings = lesson.unit.lessons;
  const idx = siblings.findIndex((l) => l.id === completedLessonId);
  const next = siblings[idx + 1];
  if (next) {
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: next.id } },
      create: { userId, lessonId: next.id, status: "available" },
      update: { status: "available" },
    });
    return;
  }

  const nextUnit = await prisma.unit.findFirst({
    where: {
      courseId: lesson.unit.courseId,
      order: { gt: lesson.unit.order },
      published: true,
    },
    orderBy: { order: "asc" },
    include: { lessons: { where: { published: true }, orderBy: { order: "asc" }, take: 1 } },
  });
  const first = nextUnit?.lessons[0];
  if (first) {
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: first.id } },
      create: { userId, lessonId: first.id, status: "available" },
      update: { status: "available" },
    });
  }
}

export async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      lessonProgress: { where: { status: "completed" } },
      achievements: true,
      vocabularyMastery: { where: { overall: { gte: 0.6 } } },
    },
  });
  if (!user) return [];

  const earned = new Set(user.achievements.map((a) => a.achievementId));
  const all = await prisma.achievement.findMany();
  const newly: string[] = [];

  for (const ach of all) {
    if (earned.has(ach.id)) continue;
    let ok = false;
    if (ach.key === "first_sentence" && user.lessonProgress.length >= 1) ok = true;
    if (ach.key === "first_conversation" && user.lessonProgress.some((p) => p.perfect || p.accuracy))
      ok = user.lessonProgress.length >= 3;
    if (ach.key === "words_50" && user.vocabularyMastery.length >= 50) ok = true;
    if (ach.key === "words_100" && user.vocabularyMastery.length >= 100) ok = true;
    if (ach.key === "perfect_lesson" && user.lessonProgress.some((p) => p.perfect)) ok = true;
    if (ach.key === "streak_7" && user.currentStreak >= 7) ok = true;
    if (ach.key === "streak_30" && user.currentStreak >= 30) ok = true;
    if (ach.key === "listening_100" && user.listeningDone >= 100) ok = true;

    if (ok) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: ach.id },
      });
      await awardXp(userId, ach.xpReward);
      newly.push(ach.key);
    }
  }
  return newly;
}

export async function getWeakReviewCount(userId: string) {
  return prisma.reviewQueueItem.count({
    where: { userId, dueAt: { lte: new Date() } },
  });
}
