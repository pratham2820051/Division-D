"use client";

import { useCallback, useEffect, useState } from "react";

import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useVoiceOutput } from "@/hooks/use-voice-output";
import { VOICE_UNCLEAR_MESSAGE, voiceLog } from "@/lib/voice-pipeline-log";
import { resolveVoiceLanguage } from "@/lib/voice-language";
import type { TranscribeResult, VoiceModeState } from "@/types/voice";
import type { LanguageCode } from "@/types/translation";

interface UseVoiceModeOptions {
  language?: LanguageCode;
  aiVoiceMuted?: boolean;
  speakText?: string | null;
  onTranscription?: (text: string, result?: TranscribeResult) => void | Promise<void>;
  onTranscriptionError?: (message: string) => void;
  onSpeakComplete?: () => void;
}

export function useVoiceMode(options: UseVoiceModeOptions = {}) {
  const {
    language = "en",
    aiVoiceMuted = false,
    speakText = null,
    onTranscription,
    onTranscriptionError,
    onSpeakComplete,
  } = options;

  const [modeState, setModeState] = useState<VoiceModeState>("idle");
  const [transcription, setTranscription] = useState("");
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [muted, setMuted] = useState(aiVoiceMuted);
  const [localError, setLocalError] = useState<string | null>(null);

  const voiceOutput = useVoiceOutput({ language, autoPlay: !muted });
  const { speak, stop: stopSpeak, audioUrl: speakAudioUrl } = voiceOutput;
  const player = useAudioPlayer({ muted });

  const handleTranscription = useCallback(
    async (text: string, result?: TranscribeResult) => {
      setTranscription(text);
      setLocalError(null);
      voiceLog("chat-submit-start", { textLength: text.length });
      try {
        await onTranscription?.(text, result);
        voiceLog("chat-submit-complete");
      } catch (err) {
        voiceLog("chat-submit-error", {
          message: err instanceof Error ? err.message : String(err),
        });
        setLocalError("Could not send your message. Please try again.");
        setModeState("error");
        return;
      }
      setModeState("idle");
    },
    [onTranscription],
  );

  const handleTranscriptionError = useCallback(
    (message: string) => {
      setLocalError(message || VOICE_UNCLEAR_MESSAGE);
      setModeState("error");
      onTranscriptionError?.(message);
    },
    [onTranscriptionError],
  );

  const { recorder, transcription: transcriptionState, isProcessing } =
    useVoiceInput({
      language,
      onTranscription: handleTranscription,
      onTranscriptionError: handleTranscriptionError,
      autoTranscribe: true,
    });

  useEffect(() => {
    if (localError || transcriptionState.error) {
      setModeState("error");
      return;
    }
    if (isProcessing) {
      setModeState("processing");
      return;
    }
    setModeState((prev) => (prev === "processing" ? "idle" : prev));
  }, [isProcessing, transcriptionState.error, localError]);

  useEffect(() => {
    if (!speakText?.trim() || muted) return;

    let cancelled = false;

    const run = async () => {
      setModeState("speaking");
      voiceLog("tts-start", { textLength: speakText.length });
      const result = await speak(speakText, resolveVoiceLanguage(language));
      if (cancelled) return;

      if (result?.audioUrl) {
        player.setSrc(result.audioUrl);
      }

      voiceLog("tts-complete");
      setModeState("idle");
      onSpeakComplete?.();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [speak, speakText, muted, language, onSpeakComplete, player]);

  const toggleVoiceMode = useCallback(() => {
    setVoiceModeEnabled((v) => {
      if (v) {
        recorder.resetRecording();
        player.stop();
        stopSpeak();
        transcriptionState.reset();
        setModeState("idle");
        setTranscription("");
        setLocalError(null);
      }
      return !v;
    });
  }, [player, recorder, stopSpeak, transcriptionState]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) {
        player.pause();
        stopSpeak();
      }
      return !m;
    });
  }, [player, stopSpeak]);

  const startListening = useCallback(async () => {
    setTranscription("");
    setLocalError(null);
    transcriptionState.reset();
    setModeState("listening");
    await recorder.startRecording();
  }, [recorder, transcriptionState]);

  const stopListening = useCallback(() => {
    if (recorder.isRecording) {
      setModeState("processing");
      recorder.stopRecording();
    }
  }, [recorder]);

  const retryTranscription = useCallback(async () => {
    setLocalError(null);
    setModeState("processing");
    const transcribed = await transcriptionState.retry();
    if (transcribed?.text?.trim()) {
      await handleTranscription(transcribed.text.trim(), transcribed);
    } else {
      handleTranscriptionError(transcriptionState.error ?? VOICE_UNCLEAR_MESSAGE);
    }
  }, [handleTranscription, handleTranscriptionError, transcriptionState]);

  const displayError =
    localError ?? transcriptionState.error ?? null;

  return {
    voiceModeEnabled,
    modeState,
    transcription,
    transcriptionError: displayError,
    language,
    muted,
    toggleVoiceMode,
    toggleMute,
    startListening,
    stopListening,
    retryTranscription,
    recorder,
    player,
    voiceOutput,
    isRetrying: transcriptionState.isRetrying,
    isProcessing,
  };
}
