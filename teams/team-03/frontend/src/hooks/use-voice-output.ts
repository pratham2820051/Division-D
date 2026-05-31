"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { revokeAudioUrl } from "@/lib/audio-utils";
import {
  LANGUAGE_CHANGE_EVENT,
  resolveVoiceLanguage,
  stopAllVoicePlayback,
} from "@/lib/voice-language";
import {
  releaseSpeakResult,
  speakText,
} from "@/services/voiceService";
import type {
  SpeakResult,
  UseVoiceOutputState,
  VoiceRequestStatus,
} from "@/types/voice";

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Could not reach the voice server. Check your connection and try again.";
    }
    return `Speech synthesis failed (${error.status}). Please try again.`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Speech synthesis failed. Please try again.";
}

interface UseVoiceOutputOptions {
  language?: string;
  autoPlay?: boolean;
}

export function useVoiceOutput(
  options: UseVoiceOutputOptions = {},
): UseVoiceOutputState {
  const { autoPlay = false } = options;

  const [status, setStatus] = useState<VoiceRequestStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakResultRef = useRef<SpeakResult | null>(null);
  const lastTextRef = useRef<{ text: string; language: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    releaseSpeakResult(speakResultRef.current);
    speakResultRef.current = null;
    revokeAudioUrl(audioUrl);
    setAudioUrl(null);
    setIsSpeaking(false);
  }, [audioUrl]);

  const reset = useCallback(() => {
    clearAudio();
    setStatus("idle");
    setError(null);
    setDurationSeconds(0);
    lastTextRef.current = null;
  }, [clearAudio]);

  useEffect(() => {
    const onLanguageChange = () => {
      clearAudio();
      setStatus("idle");
      setError(null);
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
  }, [clearAudio]);

  const playUrl = useCallback(
    async (url: string) => {
      if (typeof window === "undefined") return;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        setError("Playback failed.");
        setStatus("error");
      };

      if (!autoPlay) return;

      setIsSpeaking(true);
      try {
        await audio.play();
      } catch {
        setIsSpeaking(false);
        setError("Autoplay blocked. Tap play to listen.");
      }
    },
    [autoPlay],
  );

  const speak = useCallback(
    async (text: string, language?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      const lang = resolveVoiceLanguage(language);
      lastTextRef.current = { text: trimmed, language: lang };

      stopAllVoicePlayback();
      clearAudio();
      setStatus("loading");
      setError(null);

      try {
        const result = await speakText(trimmed, { language: lang });
        speakResultRef.current = result;
        setAudioUrl(result.audioUrl);
        setDurationSeconds(result.durationSeconds);
        setStatus("success");

        await playUrl(result.audioUrl);
        return result;
      } catch (err) {
        setError(toErrorMessage(err));
        setStatus("error");
        return null;
      }
    },
    [clearAudio, playUrl],
  );

  const retry = useCallback(async () => {
    const last = lastTextRef.current;
    if (!last) {
      setError("Nothing to retry.");
      setStatus("error");
      return null;
    }
    return speak(last.text, resolveVoiceLanguage());
  }, [speak]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      releaseSpeakResult(speakResultRef.current);
      revokeAudioUrl(audioUrl);
    };
  }, [audioUrl]);

  return {
    status,
    isLoading: status === "loading",
    isSpeaking,
    audioUrl,
    durationSeconds,
    error,
    speak,
    retry,
    stop,
    reset,
  };
}
