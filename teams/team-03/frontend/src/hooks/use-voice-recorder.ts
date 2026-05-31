"use client";

import { useAudioRecorder } from "./use-audio-recorder";

interface LegacyVoiceRecorderOptions {
  onRecordingComplete?: (blob: Blob, audioUrl: string) => void;
  onError?: (error: { code: string; message: string }) => void;
}

/** @deprecated Use useAudioRecorder instead */
export function useVoiceRecorder(options: LegacyVoiceRecorderOptions = {}) {
  return useAudioRecorder({
    onRecordingComplete: options.onRecordingComplete
      ? (result) => options.onRecordingComplete?.(result.blob, result.url)
      : undefined,
    onError: options.onError,
  });
}

export type { RecordingState } from "@/types/voice";
