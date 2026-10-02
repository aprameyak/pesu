import { createHash } from "crypto";
import { mkdir, writeFile, access } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

export type TtsRequest = {
  text: string;
  voice?: string;
  model?: string;
  languageCode?: string;
  forceRegenerate?: boolean;
};

export type TtsResult = {
  audioAssetId: string;
  publicUrl: string;
  cached: boolean;
  status: "ready" | "failed" | "pending";
  errorMessage?: string;
};

export interface SpeechProvider {
  name: string;
  synthesize(params: {
    text: string;
    voice: string;
    model: string;
    languageCode: string;
  }): Promise<{ audioBuffer: Buffer; mimeType: string }>;
}

export class SarvamSpeechProvider implements SpeechProvider {
  name = "sarvam";

  async synthesize(params: {
    text: string;
    voice: string;
    model: string;
    languageCode: string;
  }): Promise<{ audioBuffer: Buffer; mimeType: string }> {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      throw new Error("SARVAM_API_KEY is not configured");
    }

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: params.text,
        target_language_code: params.languageCode,
        model: params.model,
        speaker: params.voice,
        pace: 1.0,
        output_audio_codec: "wav",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sarvam TTS failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { audios?: string[]; request_id?: string };
    const b64 = data.audios?.[0];
    if (!b64) throw new Error("Sarvam TTS returned no audio");

    return {
      audioBuffer: Buffer.from(b64, "base64"),
      mimeType: "audio/wav",
    };
  }
}

function cacheKey(text: string, model: string, voice: string, languageCode: string) {
  return createHash("sha256")
    .update([text, model, voice, languageCode].join("|"))
    .digest("hex")
    .slice(0, 40);
}

export class TamilSpeechService {
  private provider: SpeechProvider;
  private storageDir: string;
  private publicDir: string;

  constructor(provider?: SpeechProvider) {
    this.provider = provider ?? new SarvamSpeechProvider();
    this.storageDir = path.join(process.cwd(), "storage", "audio");
    this.publicDir = path.join(process.cwd(), "public", "audio", "cache");
  }

  private defaults() {
    return {
      model: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
      voice: process.env.SARVAM_TTS_SPEAKER || "kavitha",
      languageCode: process.env.SARVAM_TTS_LANGUAGE || "ta-IN",
    };
  }

  async getAudioForText(req: TtsRequest): Promise<TtsResult> {
    const { model, voice, languageCode } = {
      ...this.defaults(),
      ...(req.voice ? { voice: req.voice } : {}),
      ...(req.model ? { model: req.model } : {}),
      ...(req.languageCode ? { languageCode: req.languageCode } : {}),
    };

    const text = req.text.trim();
    if (!text) throw new Error("Empty TTS text");

    const textHash = cacheKey(text, model, voice, languageCode);

    const existing = await prisma.audioAsset.findUnique({ where: { textHash } });
    if (existing?.status === "ready" && existing.publicUrl && !req.forceRegenerate) {
      return {
        audioAssetId: existing.id,
        publicUrl: existing.publicUrl,
        cached: true,
        status: "ready",
      };
    }

    if (!process.env.SARVAM_API_KEY) {
      const asset =
        existing ??
        (await prisma.audioAsset.create({
          data: {
            sourceText: text,
            textHash,
            provider: this.provider.name,
            model,
            voice,
            languageCode,
            status: "pending",
            errorMessage: "SARVAM_API_KEY not set — generate when configured",
          },
        }));
      return {
        audioAssetId: asset.id,
        publicUrl: "",
        cached: false,
        status: "pending",
        errorMessage: asset.errorMessage ?? undefined,
      };
    }

    try {
      const { audioBuffer, mimeType } = await this.provider.synthesize({
        text,
        voice,
        model,
        languageCode,
      });

      await mkdir(this.storageDir, { recursive: true });
      await mkdir(this.publicDir, { recursive: true });

      const filename = `${textHash}.wav`;
      const storagePath = path.join(this.storageDir, filename);
      const publicPath = path.join(this.publicDir, filename);
      await writeFile(storagePath, audioBuffer);
      await writeFile(publicPath, audioBuffer);

      const publicUrl = `/audio/cache/${filename}`;

      const asset = existing
        ? await prisma.audioAsset.update({
            where: { id: existing.id },
            data: {
              sourceText: text,
              status: "ready",
              filePath: storagePath,
              publicUrl,
              mimeType,
              errorMessage: null,
              generatedAt: new Date(),
              model,
              voice,
              languageCode,
            },
          })
        : await prisma.audioAsset.create({
            data: {
              sourceText: text,
              textHash,
              provider: this.provider.name,
              model,
              voice,
              languageCode,
              status: "ready",
              filePath: storagePath,
              publicUrl,
              mimeType,
              generatedAt: new Date(),
            },
          });

      return {
        audioAssetId: asset.id,
        publicUrl,
        cached: false,
        status: "ready",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "TTS failed";
      const asset = existing
        ? await prisma.audioAsset.update({
            where: { id: existing.id },
            data: { status: "failed", errorMessage: message },
          })
        : await prisma.audioAsset.create({
            data: {
              sourceText: text,
              textHash,
              provider: this.provider.name,
              model,
              voice,
              languageCode,
              status: "failed",
              errorMessage: message,
            },
          });

      return {
        audioAssetId: asset.id,
        publicUrl: "",
        cached: false,
        status: "failed",
        errorMessage: message,
      };
    }
  }

  async getAudio(audioAssetId: string, forceRegenerate = false): Promise<TtsResult> {
    const asset = await prisma.audioAsset.findUnique({ where: { id: audioAssetId } });
    if (!asset) throw new Error("Audio asset not found");

    if (asset.status === "ready" && asset.publicUrl && !forceRegenerate) {

      if (asset.filePath) {
        try {
          await access(asset.filePath);
          return {
            audioAssetId: asset.id,
            publicUrl: asset.publicUrl,
            cached: true,
            status: "ready",
          };
        } catch {

        }
      }
    }

    return this.getAudioForText({
      text: asset.sourceText,
      voice: asset.voice,
      model: asset.model,
      languageCode: asset.languageCode,
      forceRegenerate: true,
    });
  }

  async ensurePhraseAudio(tamilScript: string) {
    return this.getAudioForText({ text: tamilScript });
  }
}

export const tamilSpeech = new TamilSpeechService();
