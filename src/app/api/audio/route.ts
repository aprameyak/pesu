import { NextResponse } from "next/server";
import { tamilSpeech } from "@/lib/speech/tamil-speech-service";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { ttsText, audioAssetId, forceRegenerate } = body as {
    ttsText?: string;
    audioAssetId?: string;
    forceRegenerate?: boolean;
  };

  try {
    if (audioAssetId) {
      const result = await tamilSpeech.getAudio(audioAssetId, Boolean(forceRegenerate));
      return NextResponse.json(result);
    }
    if (ttsText) {
      const result = await tamilSpeech.getAudioForText({
        text: ttsText,
        forceRegenerate: Boolean(forceRegenerate),
      });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "ttsText or audioAssetId required" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audio error";
    return NextResponse.json({ error: message, status: "failed", publicUrl: "" }, { status: 500 });
  }
}
