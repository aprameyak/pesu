"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { auth, signIn, signOut, isAdminEmail } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import {
  awardXp,
  unlockNextLesson,
  recordConceptAttempt,
  checkAchievements,
  type MasteryDimension,
} from "@/lib/mastery";
import { parseJsonArray } from "@/lib/utils";

export async function registerUser(formData: FormData) {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  if (!email || password.length < 6) {
    return { error: "Email and password (6+ chars) required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already registered" };

  const passwordHash = await hash(password, 10);
  const role = isAdminEmail(email) ? "admin" : "learner";

  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || email.split("@")[0], role },
  });

  const firstLesson = await prisma.lesson.findFirst({
    where: { published: true, unit: { published: true } },
    orderBy: [{ unit: { order: "asc" } }, { order: "asc" }],
  });
  if (firstLesson) {
    await prisma.userLessonProgress.create({
      data: { userId: user.id, lessonId: firstLesson.id, status: "available" },
    });
  }

  await signIn("credentials", { email, password, redirect: false });
  return { ok: true };
}

export async function loginUser(formData: FormData) {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password" };
    throw e;
  }
}

export async function loginAsGuest() {
  await signIn("guest", { redirect: false });
  return { ok: true };
}

export async function logoutUser() {
  await signOut({ redirect: false });
  return { ok: true };
}

export async function completeOnboarding(data: {
  tamilLevel: string;
  name?: string;
  dailyGoalXp?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingDone: true,
      tamilLevel: data.tamilLevel,
      name: data.name || undefined,
      dailyGoalXp: data.dailyGoalXp || 50,
    },
  });

  if (data.tamilLevel === "understand_conversations" || data.tamilLevel === "understand_some") {
    const lessons = await prisma.lesson.findMany({
      where: { published: true, unit: { slug: "survival", published: true } },
      orderBy: { order: "asc" },
    });

    const skip = data.tamilLevel === "understand_conversations" ? 2 : 1;
    for (let i = 0; i < lessons.length; i++) {
      const status = i < skip ? "completed" : i === skip ? "available" : "locked";
      await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: { userId: session.user.id, lessonId: lessons[i].id },
        },
        create: {
          userId: session.user.id,
          lessonId: lessons[i].id,
          status: status === "locked" && i === skip ? "available" : status,
          ...(status === "completed"
            ? { completedAt: new Date(), score: 1, accuracy: 1, xpEarned: 0 }
            : {}),
        },
        update: {
          status: i === skip ? "available" : status === "completed" ? "completed" : undefined,
        },
      });
    }

    if (lessons[skip]) {
      await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: { userId: session.user.id, lessonId: lessons[skip].id },
        },
        create: {
          userId: session.user.id,
          lessonId: lessons[skip].id,
          status: "available",
        },
        update: { status: "available" },
      });
    }
  }

  await trackEvent("onboarding_completed", session.user.id, {
    tamilLevel: data.tamilLevel,
  });

  return { ok: true };
}

export async function startLesson(lessonId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: {
      userId: session.user.id,
      lessonId,
      status: "in_progress",
      startedAt: new Date(),
      attempts: 1,
    },
    update: {
      status: "in_progress",
      startedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  await trackEvent("lesson_started", session.user.id, { lessonId });
  return { ok: true };
}

export async function submitExerciseAnswer(data: {
  exerciseId: string;
  lessonId: string;
  correct: boolean;
  answer: string;
  dimension: MasteryDimension;
  timeMs?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
  if (!exercise) return { error: "Exercise not found" };

  await prisma.exerciseAttempt.create({
    data: {
      userId: session.user.id,
      exerciseId: data.exerciseId,
      correct: data.correct,
      userAnswer: data.answer,
      expectedAnswer: exercise.correctAnswers,
      dimension: data.dimension,
      timeMs: data.timeMs,
    },
  });

  const keys = parseJsonArray(exercise.conceptKeys);
  for (const key of keys) {
    await recordConceptAttempt({
      userId: session.user.id,
      conceptKey: key,
      correct: data.correct,
      dimension: data.dimension,
    });
  }

  if (data.dimension === "listening") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { listeningDone: { increment: 1 } },
    });
  }

  await trackEvent(
    data.correct ? "exercise_answered" : "exercise_incorrect",
    session.user.id,
    { exerciseId: data.exerciseId, type: exercise.type }
  );

  return { ok: true };
}

export async function completeLesson(data: {
  lessonId: string;
  correctCount: number;
  totalCount: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
  if (!lesson) return { error: "Lesson not found" };

  const accuracy = data.totalCount ? data.correctCount / data.totalCount : 1;
  const perfect = accuracy >= 0.999;
  const xp = Math.round(lesson.xpReward * (0.6 + 0.4 * accuracy));

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: data.lessonId } },
    create: {
      userId: session.user.id,
      lessonId: data.lessonId,
      status: "completed",
      score: accuracy,
      accuracy,
      xpEarned: xp,
      completedAt: new Date(),
      perfect,
      attempts: 1,
    },
    update: {
      status: "completed",
      score: accuracy,
      accuracy,
      xpEarned: xp,
      completedAt: new Date(),
      perfect,
    },
  });

  await awardXp(session.user.id, xp);
  await unlockNextLesson(session.user.id, data.lessonId);

  const concepts = await prisma.lessonConcept.findMany({
    where: { lessonId: data.lessonId },
    include: { concept: true },
  });
  const vocabKeys = concepts.filter((c) => c.concept.kind === "vocabulary").length;
  if (vocabKeys) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { wordsLearned: { increment: vocabKeys } },
    });
  }

  const achievements = await checkAchievements(session.user.id);
  await trackEvent("lesson_completed", session.user.id, {
    lessonId: data.lessonId,
    accuracy,
    xp,
  });

  return { ok: true, xp, accuracy, perfect, achievements };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return { ok: true };
  const token = crypto.randomUUID();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  console.log(`[password-reset] ${email}: /forgot-password?token=${token}`);
  return { ok: true, devToken: process.env.NODE_ENV === "development" ? token : undefined };
}

export async function resetPassword(token: string, password: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.used || row.expires < new Date()) return { error: "Invalid or expired token" };
  if (password.length < 6) return { error: "Password too short" };
  const passwordHash = await hash(password, 10);
  await prisma.user.update({ where: { id: row.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { id: row.id }, data: { used: true } });
  return { ok: true };
}

export async function regenerateAudio(audioAssetId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }
  const { tamilSpeech } = await import("@/lib/speech/tamil-speech-service");
  return tamilSpeech.getAudio(audioAssetId, true);
}

export async function generateAudioForText(text: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }
  const { tamilSpeech } = await import("@/lib/speech/tamil-speech-service");
  return tamilSpeech.getAudioForText({ text, forceRegenerate: false });
}

export async function updateContentStatus(params: {
  entityType: "lesson" | "unit";
  entityId: string;
  status: string;
  published?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id || !["admin", "reviewer"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }
  if (params.entityType === "lesson") {
    await prisma.lesson.update({
      where: { id: params.entityId },
      data: {
        status: params.status,
        published: params.published ?? params.status === "published",
      },
    });
  } else {
    await prisma.unit.update({
      where: { id: params.entityId },
      data: {
        status: params.status,
        published: params.published ?? params.status === "published",
      },
    });
  }
  await prisma.contentReview.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      lessonId: params.entityType === "lesson" ? params.entityId : null,
      status: params.status === "published" ? "approved" : "needs_review",
      reviewerId: session.user.id,
    },
  });
  return { ok: true };
}
