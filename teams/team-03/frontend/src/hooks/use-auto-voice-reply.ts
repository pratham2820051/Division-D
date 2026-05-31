"use client";

import { useCallback, useEffect, useRef } from "react";

import { revokeAudioUrl } from "@/lib/audio-utils";
import {
  LANGUAGE_CHANGE_EVENT,
  resolveVoiceLanguage,
  stopAllVoicePlayback,
} from "@/lib/voice-language";
import { speakText } from "@/services/voiceService";

export function useAutoVoiceReply() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (urlRef.current) {
      revokeAudioUrl(urlRef.current);
      urlRef.current = null;
    }
    audioRef.current = null;
  }, []);

  useEffect(() => {
    const onLanguageChange = () => stop();
    window.addEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, onLanguageChange);
  }, [stop]);

  const play = useCallback(
    async (text: string, language?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      stop();
      stopAllVoicePlayback();

      const lang = resolveVoiceLanguage(language);

      try {
        const result = await speakText(trimmed, { language: lang });
        urlRef.current = result.audioUrl;
        const audio = new Audio(result.audioUrl);
        audioRef.current = audio;
        await audio.play();
      } catch {
        // Non-blocking — voice reply is optional UX enhancement
      }
    },
    [stop],
  );

  return { play, stop };
}
