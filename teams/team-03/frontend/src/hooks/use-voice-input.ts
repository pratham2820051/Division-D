"use client";

import { useCallback, useRef, useState } from "react";

import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useVoiceTranscription } from "@/hooks/use-voice-transcription";
import {
  VOICE_TOO_SHORT_MESSAGE,
  VOICE_UNCLEAR_MESSAGE,
  voiceLog,
} from "@/lib/voice-pipeline-log";
import type { LanguageCode } from "@/types/translation";
import type { AudioRecorderResult, TranscribeResult } from "@/types/voice";

/** Reject silent / failed captures; allow normal short utterances. */
const MIN_RECORDING_BYTES = 400;
const MIN_RECORDING_SECONDS = 0.35;

interface UseVoiceInputOptions {
  language?: LanguageCode;
  onTranscription?: (text: string, result: TranscribeResult) => void | Promise<void>;
  onTranscriptionError?: (message: string) => void;
  onRecordingComplete?: (result: AudioRecorderResult) => void;
  autoTranscribe?: boolean;
  maxDurationSeconds?: number;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    language,
    onTranscription,
    onTranscriptionError,
    onRecordingComplete,
    autoTranscribe = true,
    maxDurationSeconds,
  } = options;

  const transcription = useVoiceTranscription({ language });
  const transcribeRef = useRef(transcription.transcribe);
  transcribeRef.current = transcription.transcribe;

  const [isProcessingRecording, setIsProcessingRecording] = useState(false);

  const onTranscriptionRef = useRef(onTranscription);
  const onTranscriptionErrorRef = useRef(onTranscriptionError);
  onTranscriptionRef.current = onTranscription;
  onTranscriptionErrorRef.current = onTranscriptionError;

  const handleRecordingComplete = useCallback(
    async (result: AudioRecorderResult) => {
      voiceLog("recording-stopped", {
        bytes: result.blob.size,
        durationSec: result.duration,
        mimeType: result.mimeType,
      });
      onRecordingComplete?.(result);

      if (result.blob.size < MIN_RECORDING_BYTES) {
        voiceLog("recording-too-short", {
          bytes: result.blob.size,
          durationSec: result.duration,
          reason: "empty_blob",
        });
        onTranscriptionErrorRef.current?.(VOICE_TOO_SHORT_MESSAGE);
        return;
      }

      if (result.duration < MIN_RECORDING_SECONDS) {
        voiceLog("recording-too-short", {
          bytes: result.blob.size,
          durationSec: result.duration,
        });
        onTranscriptionErrorRef.current?.(VOICE_TOO_SHORT_MESSAGE);
        return;
      }

      if (!autoTranscribe) return;

      setIsProcessingRecording(true);
      try {
        const transcribed = await transcribeRef.current(result.blob, result.mimeType);
        if (transcribed?.text?.trim()) {
          await onTranscriptionRef.current?.(transcribed.text.trim(), transcribed);
        } else {
          onTranscriptionErrorRef.current?.(VOICE_UNCLEAR_MESSAGE);
        }
      } catch {
        onTranscriptionErrorRef.current?.(VOICE_UNCLEAR_MESSAGE);
      } finally {
        setIsProcessingRecording(false);
      }
    },
    [autoTranscribe, onRecordingComplete],
  );

  const recorder = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    maxDurationSeconds,
  });

  const startRecording = useCallback(async () => {
    voiceLog("recording-started", { language });
    await recorder.startRecording();
  }, [language, recorder]);

  const stopRecording = useCallback(() => {
    if (recorder.isRecording) {
      voiceLog("recording-stop-requested");
      recorder.stopRecording();
    }
  }, [recorder]);

  const isProcessing =
    isProcessingRecording || transcription.isTranscribing;

  return {
    recorder: {
      ...recorder,
      startRecording,
      stopRecording,
    },
    transcription,
    isProcessing,
  };
}
