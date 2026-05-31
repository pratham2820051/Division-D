import {
  apiFetchBlob,
  apiUploadJson,
  fetchWithRetry,
  type FetchWithRetryOptions,
} from "@/lib/api-client";
import { API_BASE } from "@/lib/constants";
import { revokeAudioUrl } from "@/lib/audio-utils";
import type {
  SpeakApiRequest,
  SpeakResult,
  SpeakTextOptions,
  TranscribeApiResponse,
  TranscribeAudioOptions,
  TranscribeResult,
} from "@/types/voice";

const TRANSCRIBE_PATH = "/api/v1/voice/transcribe";
const SPEAK_PATH = "/api/v1/voice/speak";

function extensionFromMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  return "webm";
}

function retryOptions(retries?: number): FetchWithRetryOptions | undefined {
  return retries !== undefined ? { retries } : undefined;
}

/**
 * Upload recorded audio to POST /api/v1/voice/transcribe.
 */
export async function transcribeAudio(
  audio: Blob,
  options: TranscribeAudioOptions = {},
): Promise<TranscribeResult> {
  const filename =
    options.filename ?? `recording.${extensionFromMime(audio.type || "audio/webm")}`;

  const formData = new FormData();
  formData.append("audio", audio, filename);
  if (options.language) {
    formData.append("language", options.language);
  }

  if (typeof console !== "undefined") {
    console.info("[voice:api-request]", {
      path: TRANSCRIBE_PATH,
      bytes: audio.size,
      language: options.language,
    });
  }

  const data = await apiUploadJson<TranscribeApiResponse>(
    TRANSCRIBE_PATH,
    formData,
    {
      retries: options.retries ?? 1,
      timeoutMs: options.timeoutMs ?? 45_000,
    },
  );

  if (typeof console !== "undefined") {
    console.info("[voice:api-response]", {
      textLength: data.text?.length ?? 0,
      provider: data.provider,
      language: data.language,
    });
  }

  return {
    text: data.text,
    language: data.language,
    confidence: data.confidence,
    languageConfidence: data.language_confidence ?? data.confidence,
    provider: data.provider ?? "unknown",
    fallbackUsed: data.fallback_used ?? false,
    requestedLanguage: data.requested_language,
    detectedLanguage: data.detected_language,
  };
}

/**
 * Send text to POST /api/v1/voice/speak and return playable audio.
 */
export async function speakText(
  text: string,
  options: SpeakTextOptions = {},
): Promise<SpeakResult> {
  const body: SpeakApiRequest = {
    text: text.trim(),
    language: options.language ?? "en",
  };

  const { blob, headers } = await apiFetchBlob(
    SPEAK_PATH,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    retryOptions(options.retries),
  );

  const contentType = headers.get("content-type") ?? blob.type ?? "audio/wav";
  const durationHeader = headers.get("X-Audio-Duration");
  const durationSeconds = durationHeader
    ? Number.parseFloat(durationHeader)
    : 0;

  const audioUrl = URL.createObjectURL(blob);

  return {
    audioBlob: blob,
    audioUrl,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 0,
    contentType,
  };
}

/** Revoke a URL returned from speakText when no longer needed. */
export function releaseSpeakResult(result: SpeakResult | null) {
  if (result?.audioUrl) {
    revokeAudioUrl(result.audioUrl);
  }
}

/**
 * Lightweight availability check (HEAD on OpenAPI docs or transcribe OPTIONS).
 */
export async function isVoiceServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetchWithRetry(`${API_BASE}/docs`, { method: "HEAD" }, {
      retries: 0,
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** @deprecated Use speakText */
export const synthesizeSpeech = speakText;

/** Re-export for service index compatibility */
export type { TranscribeResult, SpeakResult };
