"use client";

import { useEffect, useRef } from "react";
import { Loader2, Mic, RotateCcw, Square, X } from "lucide-react";

import { VoiceControls } from "@/components/voice/VoiceControls";
import { VoicePlayer } from "@/components/voice/VoicePlayer";
import { VoiceStatusIndicator } from "@/components/voice/VoiceStatusIndicator";
import { VoiceVisualizer } from "@/components/voice/VoiceVisualizer";
import { Button } from "@/components/ui/button";
import { useVoiceMode } from "@/hooks/use-voice-mode";
import { VOICE_UNCLEAR_MESSAGE } from "@/lib/voice-pipeline-log";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";
import type { TranscribeResult } from "@/types/voice";

interface VoiceModeProps {
  language?: LanguageCode;
  speakText?: string | null;
  onTranscription?: (text: string, result?: TranscribeResult) => void;
  onSpeakComplete?: () => void;
  onClose?: () => void;
  /** Start microphone as soon as the panel opens (chat mic button). */
  autoStartRecording?: boolean;
  /** Compact layout for the chat input bar — no scroll needed. */
  variant?: "inline" | "panel";
  className?: string;
}

export function VoiceMode({
  language = "en",
  speakText = null,
  onTranscription,
  onSpeakComplete,
  onClose,
  autoStartRecording = false,
  variant = "panel",
  className,
}: VoiceModeProps) {
  const {
    voiceModeEnabled,
    modeState,
    transcription,
    transcriptionError,
    muted,
    toggleVoiceMode,
    toggleMute,
    startListening,
    stopListening,
    retryTranscription,
    recorder,
    player,
    voiceOutput,
    isRetrying,
    isProcessing: voiceProcessing,
  } = useVoiceMode({
    language,
    speakText,
    onTranscription,
    onSpeakComplete,
  });

  const isListening = recorder.isRecording || modeState === "listening";
  const isProcessing = voiceProcessing || modeState === "processing";
  const isSpeaking = modeState === "speaking" || voiceOutput.isSpeaking;
  const hasError = modeState === "error" || !!transcriptionError;
  const errorMessage = transcriptionError ?? VOICE_UNCLEAR_MESSAGE;
  const isInline = variant === "inline";
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartRecording || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void startListening();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [autoStartRecording, startListening]);

  const controls = (
    <div className="flex items-center gap-3">
      {hasError && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={retryTranscription}
          className={cn(
            "gap-1",
            isInline
              ? "border-destructive/30"
              : "border-white/20 bg-white/5 text-white hover:bg-white/10",
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}

      {!isListening && !isProcessing && !hasError && (
        <Button
          type="button"
          size="lg"
          onClick={startListening}
          disabled={isProcessing}
          className={cn(
            "rounded-full",
            isInline
              ? "h-12 w-12 bg-primary text-primary-foreground hover:bg-primary/90"
              : "h-14 w-14 bg-white text-zinc-900 hover:bg-zinc-200",
          )}
          aria-label="Start listening"
        >
          <Mic className={isInline ? "h-5 w-5" : "h-6 w-6"} />
        </Button>
      )}

      {isListening && (
        <Button
          type="button"
          size="lg"
          variant="destructive"
          onClick={stopListening}
          className={cn("rounded-full", isInline ? "h-12 w-12" : "h-14 w-14")}
          aria-label="Stop listening"
        >
          <Square className={cn("fill-current", isInline ? "h-4 w-4" : "h-5 w-5")} />
        </Button>
      )}

      {isProcessing && (
        <div
          className={cn(
            "flex items-center justify-center",
            isInline ? "h-12 w-12" : "h-14 w-14",
          )}
        >
          <Loader2
            className={cn(
              "animate-spin text-emerald-400",
              isInline ? "h-6 w-6" : "h-8 w-8",
            )}
          />
        </div>
      )}
    </div>
  );

  if (isInline) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-primary/20 bg-card p-3 shadow-md",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0 text-muted-foreground"
              aria-label="Close voice mode"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <VoiceVisualizer
            levels={recorder.levels}
            isActive={isListening || isSpeaking}
            variant="orb"
            className="!h-20 !w-20 shrink-0 [&>div]:!inset-1"
          />

          <div className="min-w-0 flex-1">
            <VoiceStatusIndicator
              state={hasError ? "error" : modeState}
              permission={recorder.permission}
              className="mb-1"
            />
            <p className="text-sm text-foreground">
              {isProcessing && isRetrying && "Retrying transcription..."}
              {isProcessing && !isRetrying && "Transcribing..."}
              {isSpeaking && "Playing response..."}
              {hasError && errorMessage}
              {isListening &&
                `Listening ${recorder.formattedDuration} — speak, then tap stop`}
              {!isProcessing && !isSpeaking && !isListening && !hasError &&
                "Starting microphone…"}
            </p>
            {transcription && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {transcription}
              </p>
            )}
          </div>

          {controls}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-900 to-zinc-950 text-white shadow-2xl",
        className,
      )}
    >
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Close voice mode"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex flex-col items-center px-4 py-8 sm:px-8 sm:py-12">
        <p className="mb-1 text-sm font-medium text-emerald-400">PashuMitra AI</p>
        <p className="mb-6 text-xs text-zinc-400">Voice Mode</p>

        <VoiceVisualizer
          levels={recorder.levels}
          isActive={isListening || isSpeaking}
          variant="orb"
          className="mb-8"
        />

        <VoiceStatusIndicator
          state={hasError ? "error" : modeState}
          permission={recorder.permission}
          className="mb-4 [&_span:last-child]:text-zinc-400"
        />

        <p className="mb-6 min-h-[1.25rem] max-w-sm text-center text-sm text-zinc-300">
          {isProcessing && isRetrying && "Retrying transcription..."}
          {isProcessing && !isRetrying && "Transcribing your speech..."}
          {isSpeaking && "Playing response..."}
          {hasError && errorMessage}
          {isListening && "Speak now — describe your animal's symptoms"}
          {!isProcessing && !isSpeaking && !isListening && !hasError &&
            "Tap the mic to start speaking"}
        </p>

        {transcription && (
          <div className="mb-3 w-full max-w-md rounded-xl bg-white/5 p-3 text-left">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">You said</p>
            <p className="text-sm text-zinc-200">{transcription}</p>
          </div>
        )}

        {(player.src || voiceOutput.audioUrl) && (
          <VoicePlayer
            src={voiceOutput.audioUrl ?? player.src ?? ""}
            muted={muted}
            className="mb-4 w-full max-w-md bg-white/5 [&_p]:text-zinc-400"
            label="AI response audio"
          />
        )}

        <div className="flex items-center gap-3">{controls}</div>
      </div>

      <div className="border-t border-white/10 p-3">
        <VoiceControls
          voiceModeEnabled={voiceModeEnabled}
          muted={muted}
          language={language}
          onToggleVoiceMode={toggleVoiceMode}
          onToggleMute={toggleMute}
          className="border-white/10 bg-white/5"
        />
      </div>
    </div>
  );
}
