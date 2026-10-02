import { prisma } from "@/lib/db";

export type AnalyticsEventName =
  | "onboarding_completed"
  | "lesson_started"
  | "lesson_completed"
  | "exercise_answered"
  | "exercise_incorrect"
  | "audio_played"
  | "audio_replayed"
  | "review_completed";

const ALLOWED = new Set<AnalyticsEventName>([
  "onboarding_completed",
  "lesson_started",
  "lesson_completed",
  "exercise_answered",
  "exercise_incorrect",
  "audio_played",
  "audio_replayed",
  "review_completed",
]);

export function isAnalyticsEvent(event: string): event is AnalyticsEventName {
  return ALLOWED.has(event as AnalyticsEventName);
}

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
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[analytics]", event, err);
    }
  }
}
