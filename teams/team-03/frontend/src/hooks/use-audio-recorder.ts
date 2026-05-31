"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatDuration,
  getSupportedMimeType,
  mapRecorderError,
  queryMicPermission,
  revokeAudioUrl,
} from "@/lib/audio-utils";
import type {
  AudioRecorderResult,
  PermissionState,
  RecordingState,
  UseAudioRecorderOptions,
  VoiceRecorderError,
} from "@/types/voice";

const BAR_COUNT = 32;
const DURATION_TICK_MS = 100;

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { onRecordingComplete, onError, maxDurationSeconds = 120 } = options;

  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<VoiceRecorderError | null>(null);
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("audio/webm");
  const durationRef = useRef(0);
  const recordingStartedAtRef = useRef<number | null>(null);
  const skipCompleteRef = useRef(false);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setLevels(Array(BAR_COUNT).fill(0.08));
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const setRecorderError = useCallback(
    (err: VoiceRecorderError) => {
      setError(err);
      onError?.(err);
    },
    [onError],
  );

  const getElapsedSeconds = useCallback(() => {
    if (recordingStartedAtRef.current === null) return 0;
    return (performance.now() - recordingStartedAtRef.current) / 1000;
  }, []);

  const resetRecording = useCallback(() => {
    skipCompleteRef.current = true;
    const active = mediaRecorderRef.current;
    if (active && active.state === "recording") {
      try {
        active.requestData();
      } catch {
        /* optional */
      }
      active.stop();
    }
    clearTimer();
    stopAnalyser();
    stopStream();
    revokeAudioUrl(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    durationRef.current = 0;
    recordingStartedAtRef.current = null;
    setState("idle");
    setError(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [audioUrl, clearTimer, stopAnalyser, stopStream]);

  const startAnalyser = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);

      const step = Math.floor(data.length / BAR_COUNT);
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const slice = data.slice(i * step, (i + 1) * step);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        return Math.max(0.08, avg / 255);
      });

      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecorderError({
        code: "NOT_SUPPORTED",
        message: "MediaRecorder is not supported in this browser.",
      });
      setPermission("unsupported");
      return;
    }

    try {
      setError(null);
      revokeAudioUrl(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
      setDuration(0);
      durationRef.current = 0;
      recordingStartedAtRef.current = null;
      skipCompleteRef.current = false;
      chunksRef.current = [];

      const perm = await queryMicPermission();
      setPermission(perm);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setPermission("granted");
      startAnalyser(stream);

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        clearTimer();
        stopAnalyser();
        stopStream();

        const elapsed = getElapsedSeconds();
        durationRef.current = elapsed;
        setDuration(elapsed);
        recordingStartedAtRef.current = null;

        if (skipCompleteRef.current) {
          skipCompleteRef.current = false;
          chunksRef.current = [];
          setState("idle");
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const url = URL.createObjectURL(blob);
        const result: AudioRecorderResult = {
          blob,
          url,
          duration: elapsed,
          mimeType: mimeTypeRef.current,
        };

        setAudioBlob(blob);
        setAudioUrl(url);
        setState("stopped");
        onRecordingComplete?.(result);
      };

      recorder.onerror = () => {
        setRecorderError({
          code: "UNKNOWN",
          message: "Recording failed unexpectedly.",
        });
        resetRecording();
      };

      recordingStartedAtRef.current = performance.now();
      recorder.start(250);
      setState("recording");

      timerRef.current = setInterval(() => {
        const elapsed = getElapsedSeconds();
        durationRef.current = elapsed;
        setDuration(elapsed);
        if (elapsed >= maxDurationSeconds) {
          mediaRecorderRef.current?.stop();
        }
      }, DURATION_TICK_MS);
    } catch (err) {
      const mapped = mapRecorderError(err);
      setRecorderError(mapped);
      if (mapped.code === "PERMISSION_DENIED") setPermission("denied");
      setState("idle");
      stopAnalyser();
      stopStream();
    }
  }, [
    audioUrl,
    clearTimer,
    maxDurationSeconds,
    onRecordingComplete,
    resetRecording,
    setRecorderError,
    getElapsedSeconds,
    startAnalyser,
    stopAnalyser,
    stopStream,
  ]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        /* some browsers omit requestData */
      }
      recorder.stop();
    }
  }, []);

  useEffect(() => {
    queryMicPermission().then(setPermission);
    return () => {
      clearTimer();
      stopAnalyser();
      stopStream();
      revokeAudioUrl(audioUrl);
    };
  }, [audioUrl, clearTimer, stopAnalyser, stopStream]);

  return {
    state,
    duration,
    formattedDuration: formatDuration(duration),
    audioUrl,
    audioBlob,
    error,
    permission,
    levels,
    isRecording: state === "recording",
    hasRecording: state === "stopped" && !!audioUrl,
    isIdle: state === "idle",
    startRecording,
    stopRecording,
    resetRecording,
  };
}
