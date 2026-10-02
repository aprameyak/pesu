"use client";

import { useCallback, useRef, useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioButtonProps = {
  ttsText?: string | null;
  audioUrl?: string | null;
  audioAssetId?: string | null;
  label?: string;
  className?: string;
  size?: "sm" | "md";
};

export function AudioButton({
  ttsText,
  audioUrl: initialUrl,
  audioAssetId,
  label = "Play pronunciation",
  className,
  size = "md",
}: AudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedUrl, setFetchedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<"normal" | "slow">("normal");
  const playCount = useRef(0);
  const url = fetchedUrl || initialUrl || "";

  const ensureAudio = useCallback(async () => {
    if (url) return url;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttsText, audioAssetId }),
      });
      const data = await res.json();
      if (data.publicUrl) {
        setFetchedUrl(data.publicUrl);
        return data.publicUrl as string;
      }
      setError(data.error || "Audio unavailable. Set SARVAM_API_KEY or generate from Admin.");
      return "";
    } catch {
      setError("Audio unavailable.");
      return "";
    } finally {
      setLoading(false);
    }
  }, [url, ttsText, audioAssetId]);

  const play = async () => {
    const resolved = await ensureAudio();
    if (!resolved) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    const audio = audioRef.current;
    audio.src = resolved;
    audio.playbackRate = speed === "slow" ? 0.7 : 1;
    setPlaying(true);
    playCount.current += 1;
    try {
      await audio.play();
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: playCount.current > 1 ? "audio_replayed" : "audio_played",
          payload: { ttsText, speed },
        }),
      });
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={play}
        aria-label={label}
        disabled={loading || (!ttsText && !audioAssetId && !url)}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-mango/30 bg-mango/10 text-mango transition hover:bg-mango/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mango disabled:opacity-40",
          size === "sm" ? "h-9 w-9" : "h-11 w-11",
          playing && "ring-2 ring-mango/40"
        )}
      >
        {loading ? (
          <Loader2 className={size === "sm" ? "h-4 w-4 animate-spin" : "h-5 w-5 animate-spin"} />
        ) : (
          <Volume2 className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        )}
      </button>
      <button
        type="button"
        onClick={() => setSpeed((s) => (s === "normal" ? "slow" : "normal"))}
        className="rounded-full px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted hover:bg-black/5"
        aria-label={`Playback speed: ${speed}. Click to toggle.`}
      >
        {speed === "slow" ? "Slow" : "1x"}
      </button>
      {error && (
        <span className="max-w-[12rem] text-[11px] text-ink-faint" role="status">
          {error}
        </span>
      )}
    </div>
  );
}
