"use client";

import { useTransition } from "react";
import { generateAudioForText, regenerateAudio, updateContentStatus } from "@/lib/actions";

export function AdminActions({
  entityType,
  entityId,
  status,
  regenId,
  generate,
}: {
  entityType?: "lesson" | "unit";
  entityId?: string;
  status?: string;
  regenId?: string;
  generate?: boolean;
}) {
  const [pending, start] = useTransition();

  if (generate) {
    return (
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const text = String(fd.get("text") || "");
          start(async () => {
            await generateAudioForText(text);
            window.location.reload();
          });
        }}
      >
        <input
          name="text"
          className="input-field font-tamil"
          placeholder="தமிழ் உரை for TTS"
          required
        />
        <button className="btn-primary shrink-0" disabled={pending} type="submit">
          Generate audio
        </button>
      </form>
    );
  }

  if (regenId) {
    return (
      <button
        type="button"
        className="text-xs font-semibold text-mango"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await regenerateAudio(regenId);
            window.location.reload();
          })
        }
      >
        Regenerate
      </button>
    );
  }

  if (!entityType || !entityId) return null;

  return (
    <div className="flex gap-2">
      {status !== "published" && (
        <button
          type="button"
          className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await updateContentStatus({
                entityType,
                entityId,
                status: "published",
                published: true,
              });
              window.location.reload();
            })
          }
        >
          Publish
        </button>
      )}
      <button
        type="button"
        className="rounded-full bg-border/60 px-3 py-1 text-xs font-semibold text-ink-muted"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await updateContentStatus({
              entityType,
              entityId,
              status: "needs_review",
              published: false,
            });
            window.location.reload();
          })
        }
      >
        Needs review
      </button>
    </div>
  );
}
