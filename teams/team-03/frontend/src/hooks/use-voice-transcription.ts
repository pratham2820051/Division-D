"use client";

import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { VOICE_UNCLEAR_MESSAGE, voiceLog } from "@/lib/voice-pipeline-log";
import type { LanguageCode } from "@/types/translation";
import { resolveVoiceLanguage } from "@/lib/voice-language";
import { transcribeAudio } from "@/services/voiceService";
import type {
  TranscribeResult,
  UseVoiceTranscriptionState,
  VoiceRequestStatus,
} from "@/types/voice";

const TRANSCRIBE_TIMEOUT_MS = 45_000;
const MAX_TRANSCRIBE_ATTEMPTS = 2;

interface UseVoiceTranscriptionOptions {
  language?: LanguageCode;
}

function toErrorMessage(error: unknown, fallbackUsed?: boolean): string {
  if (fallbackUsed) {
    return "Voice recognition used a fallback engine. Results may be less accurate.";
  }
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Could not reach the voice server. Check your connection and try again.";
    }
    if (error.status === 400) {
      return "Recording was too short or empty. Speak again, then tap stop.";
    }
    if (error.status === 408 || error.status === 504) {
      return VOICE_UNCLEAR_MESSAGE;
    }
    if (error.status === 502) {
      return VOICE_UNCLEAR_MESSAGE;
    }
    return VOICE_UNCLEAR_MESSAGE;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return VOICE_UNCLEAR_MESSAGE;
    }
    return error.message || VOICE_UNCLEAR_MESSAGE;
  }
  return VOICE_UNCLEAR_MESSAGE;
}

export function useVoiceTranscription(
  options: UseVoiceTranscriptionOptions = {},
): UseVoiceTranscriptionState {
  const { language: languageHint } = options;
  const [status, setStatus] = useState<VoiceRequestStatus>("idle");
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastRecordingRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const languageRef = useRef(languageHint);
  languageRef.current = languageHint;

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    lastRecordingRef.current = null;
  }, []);

  const runTranscription = useCallback(async (blob: Blob, mimeType: string) => {
    const type = mimeType ?? blob.type ?? "audio/webm";
    const sttLanguage = resolveVoiceLanguage(languageRef.current);
    lastRecordingRef.current = { blob, mimeType: type };
    setError(null);
    setResult(null);

    voiceLog("upload-sent", {
      bytes: blob.size,
      mimeType: type,
      language: sttLanguage,
    });

    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_TRANSCRIBE_ATTEMPTS; attempt += 1) {
      setStatus(attempt === 0 ? "loading" : "retrying");

      try {
        const response = await transcribeAudio(blob, {
          filename: `recording.${type.includes("webm") ? "webm" : type.includes("wav") ? "wav" : "webm"}`,
          language: sttLanguage,
          retries: 0,
          timeoutMs: TRANSCRIBE_TIMEOUT_MS,
        });

        voiceLog("transcription-completed", {
          textLength: response.text?.length ?? 0,
          language: response.language,
          provider: response.provider,
          confidence: response.confidence,
        });

        if (!response.text?.trim()) {
          setError(VOICE_UNCLEAR_MESSAGE);
          setStatus("error");
          return null;
        }

        setResult(response);
        setStatus("success");
        if (response.fallbackUsed) {
          setError(toErrorMessage(null, true));
        }
        return response;
      } catch (err) {
        lastError = err;
        voiceLog("transcription-error", {
          attempt: attempt + 1,
          message: err instanceof Error ? err.message : String(err),
        });
        if (attempt === MAX_TRANSCRIBE_ATTEMPTS - 1) {
          break;
        }
      }
    }

    setError(toErrorMessage(lastError));
    setStatus("error");
    return null;
  }, []);

  const transcribe = useCallback(
    async (blob: Blob, mimeType?: string) =>
      runTranscription(blob, mimeType ?? blob.type ?? "audio/webm"),
    [runTranscription],
  );

  const retry = useCallback(async () => {
    const last = lastRecordingRef.current;
    if (!last) {
      setError("Nothing to retry. Record again.");
      setStatus("error");
      return null;
    }
    return runTranscription(last.blob, last.mimeType);
  }, [runTranscription]);

  return {
    status,
    isTranscribing: status === "loading" || status === "retrying",
    isRetrying: status === "retrying",
    result,
    error,
    transcribe,
    retry,
    reset,
  };
}
