"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatDuration } from "@/lib/audio-utils";
import type { UseAudioPlayerOptions } from "@/types/voice";

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const { src: initialSrc = null, autoPlay = false, muted = false, onEnded } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState<string | null>(initialSrc);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSrc(initialSrc ?? null);
  }, [initialSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = muted;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };
    const onLoadStart = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onEndedHandler = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setError("Failed to load audio.");
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEndedHandler);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEndedHandler);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [muted, onEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    audio.src = src;
    if (autoPlay) {
      audio.play().catch(() => setError("Autoplay blocked by browser."));
    }
  }, [autoPlay, src]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    setError(null);
    try {
      await audio.play();
    } catch {
      setError("Playback failed.");
    }
  }, [src]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) pause();
    else await play();
  }, [isPlaying, pause, play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, duration || 0));
  }, [duration]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    audioRef,
    src,
    setSrc,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progress,
    formattedCurrent: formatDuration(Math.floor(currentTime)),
    formattedDuration: formatDuration(Math.floor(duration)),
    error,
    play,
    pause,
    toggle,
    seek,
    stop,
  };
}
