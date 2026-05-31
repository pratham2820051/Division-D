"use client";

import { Loader2, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { cn } from "@/lib/utils";

interface VoicePlayerProps {
  src: string;
  className?: string;
  label?: string;
  autoPlay?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  variant?: "default" | "compact";
}

export function VoicePlayer({
  src,
  className,
  label = "Playback",
  autoPlay = false,
  muted = false,
  onEnded,
  variant = "default",
}: VoicePlayerProps) {
  const {
    audioRef,
    isPlaying,
    isLoading,
    progress,
    formattedCurrent,
    formattedDuration,
    error,
    toggle,
    seek,
    duration,
  } = useAudioPlayer({ src, autoPlay, muted, onEnded });

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full"
          onClick={toggle}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
        </Button>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formattedCurrent} / {formattedDuration}
        </span>
        <audio ref={audioRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-muted/40 p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formattedCurrent} / {formattedDuration}
        </span>
      </div>

      <button
        type="button"
        className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          seek(ratio * duration);
        }}
        aria-label="Seek audio"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </button>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 rounded-full"
          onClick={toggle}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
