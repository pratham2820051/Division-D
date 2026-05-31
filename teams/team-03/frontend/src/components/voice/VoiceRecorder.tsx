"use client";

import { Loader2, Mic, RotateCcw, Square } from "lucide-react";

import { RecordingTimer } from "@/components/voice/RecordingTimer";
import { VoicePlayer } from "@/components/voice/VoicePlayer";
import { VoiceStatusIndicator } from "@/components/voice/VoiceStatusIndicator";
import { VoiceVisualizer } from "@/components/voice/VoiceVisualizer";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";
import type { AudioRecorderResult } from "@/types/voice";

interface VoiceRecorderProps {
  onRecordingComplete?: (result: AudioRecorderResult) => void;
  onTranscription?: (text: string) => void;
  onError?: (error: { code: string; message: string }) => void;
  className?: string;
  showVisualizer?: boolean;
  autoTranscribe?: boolean;
}

export function VoiceRecorder({
  onRecordingComplete,
  onTranscription,
  onError,
  className,
  showVisualizer = true,
  autoTranscribe = true,
}: VoiceRecorderProps) {
  const { recorder, transcription, isProcessing } = useVoiceInput({
    autoTranscribe,
    onTranscription,
    onRecordingComplete,
  });

  const {
    state,
    duration,
    audioUrl,
    error,
    permission,
    levels,
    isRecording,
    hasRecording,
    isIdle,
    startRecording,
    stopRecording,
    resetRecording,
  } = recorder;

  const handleStart = async () => {
    transcription.reset();
    await startRecording();
  };

  const handleReset = () => {
    transcription.reset();
    resetRecording();
  };

  const displayError =
    error?.message ?? transcription.error ?? null;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <VoiceStatusIndicator
          state={isProcessing ? "processing" : transcription.error ? "error" : state}
          permission={permission}
        />
        {(isRecording || hasRecording || isProcessing) && (
          <RecordingTimer seconds={duration} isRecording={isRecording} />
        )}
      </div>

      {showVisualizer && (
        <VoiceVisualizer
          levels={levels}
          isActive={isRecording || isProcessing}
          className="mb-4"
        />
      )}

      {transcription.result && (
        <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Transcription</p>
          <p>{transcription.result.text}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {isIdle && !displayError && !isProcessing && (
          <Button
            type="button"
            onClick={handleStart}
            className="gap-2 rounded-full px-6"
            disabled={permission === "unsupported"}
          >
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            variant="destructive"
            onClick={stopRecording}
            className="gap-2 rounded-full px-6"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop Recording
          </Button>
        )}

        {isProcessing && (
          <Button type="button" disabled className="gap-2 rounded-full px-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing...
          </Button>
        )}

        {(hasRecording || transcription.error) && !isProcessing && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="gap-2 rounded-full"
            >
              <RotateCcw className="h-4 w-4" />
              Re-record
            </Button>
            {transcription.error && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void transcription.retry()}
                className="gap-2 rounded-full"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </>
        )}
      </div>

      {permission === "denied" && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
          Microphone blocked. Allow access in browser settings and reload.
        </p>
      )}

      {displayError && permission !== "denied" && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
          {displayError}
        </p>
      )}

      {hasRecording && audioUrl && (
        <VoicePlayer src={audioUrl} className="mt-4" label="Your recording" />
      )}
    </div>
  );
}
