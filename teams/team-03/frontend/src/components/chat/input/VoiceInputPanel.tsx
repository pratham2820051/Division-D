"use client";

import { Mic, RotateCcw, Square } from "lucide-react";

import { RecordingTimer } from "@/components/voice/RecordingTimer";
import { Button } from "@/components/ui/button";

interface VoiceInputPanelProps {
  duration: number;
  audioUrl: string | null;
  error: string | null;
  isRecording: boolean;
  hasRecording: boolean;
  onStop: () => void;
  onReset: () => void;
}

export function VoiceInputPanel({
  duration,
  audioUrl,
  error,
  isRecording,
  hasRecording,
  onStop,
  onReset,
}: VoiceInputPanelProps) {
  if (!isRecording && !hasRecording && !error) return null;

  return (
    <div className="mb-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={
              isRecording
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600"
                : "flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary"
            }
          >
            <Mic className="h-3.5 w-3.5" />
          </span>
          <RecordingTimer seconds={duration} isRecording={isRecording} />
        </div>
        <div className="flex gap-2">
          {isRecording && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onStop}
              className="h-8 gap-1"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop
            </Button>
          )}
          {hasRecording && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onReset}
              className="h-8 gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
      {hasRecording && audioUrl && (
        <audio controls src={audioUrl} className="mt-2 h-8 w-full" preload="metadata" />
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
