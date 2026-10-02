import { prisma } from "@/lib/db";

export type AnalyticsEventName =
  | "onboarding_completed"
  | "placement_completed"
  | "lesson_started"
  | "lesson_completed"
  | "exercise_answered"
  | "exercise_incorrect"
  | "audio_played"
  | "audio_replayed"
  | "concept_mastered"
  | "vocabulary_mastered"
  | "review_started"
  | "review_completed"
  | "streak_extended"
  | "course_abandoned";

export async function trackEvent(
  event: AnalyticsEventName,
  userId?: string | null,
  payload?: Record<string, unknown>
) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        userId: userId || null,
        payload: payload ? JSON.stringify(payload) : null,
      },
    });
  } catch {

  }
}
