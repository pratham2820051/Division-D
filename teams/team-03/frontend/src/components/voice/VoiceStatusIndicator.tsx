import { cn } from "@/lib/utils";
import type { PermissionState, RecordingState, VoiceModeState } from "@/types/voice";

interface VoiceStatusIndicatorProps {
  state: RecordingState | VoiceModeState;
  permission?: PermissionState;
  className?: string;
}

const STATE_LABELS: Record<string, string> = {
  idle: "Ready",
  recording: "Recording",
  stopped: "Recorded",
  processing: "Processing",
  listening: "Listening",
  speaking: "Speaking",
  error: "Error",
};

export function VoiceStatusIndicator({
  state,
  permission,
  className,
}: VoiceStatusIndicatorProps) {
  const isActive = ["recording", "listening", "processing", "speaking"].includes(state);
  const isError = state === "error" || permission === "denied";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative flex h-2.5 w-2.5 rounded-full",
          isError
            ? "bg-destructive"
            : isActive
              ? "bg-emerald-500"
              : "bg-muted-foreground/40",
        )}
      >
        {isActive && !isError && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          isError ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {permission === "denied"
          ? "Mic blocked"
          : STATE_LABELS[state] ?? "Ready"}
      </span>
    </div>
  );
}
