"use client";

import { Globe, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLanguageLabel } from "@/lib/languages";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types/translation";

interface VoiceControlsProps {
  voiceModeEnabled: boolean;
  muted: boolean;
  language: LanguageCode | string;
  onToggleVoiceMode: () => void;
  onToggleMute: () => void;
  className?: string;
}

export function VoiceControls({
  voiceModeEnabled,
  muted,
  language,
  onToggleVoiceMode,
  onToggleMute,
  className,
}: VoiceControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background/80 p-2 backdrop-blur-sm",
        className,
      )}
    >
      <Button
        type="button"
        variant={voiceModeEnabled ? "default" : "outline"}
        size="sm"
        onClick={onToggleVoiceMode}
        className="gap-2 rounded-full"
      >
        {voiceModeEnabled ? (
          <Mic className="h-4 w-4" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
        {voiceModeEnabled ? "Voice mode on" : "Voice mode"}
      </Button>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleMute}
          disabled={!voiceModeEnabled}
          className="gap-1.5 rounded-full"
          aria-label={muted ? "Unmute AI voice" : "Mute AI voice"}
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{muted ? "Muted" : "AI voice"}</span>
        </Button>

        <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
          <Globe className="h-3.5 w-3.5" />
          {getLanguageLabel(language)}
        </div>
      </div>
    </div>
  );
}
