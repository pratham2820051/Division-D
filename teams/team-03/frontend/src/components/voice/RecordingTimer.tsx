import { formatDuration } from "@/lib/audio-utils";
import { cn } from "@/lib/utils";

interface RecordingTimerProps {
  seconds: number;
  isRecording?: boolean;
  className?: string;
}

export function RecordingTimer({
  seconds,
  isRecording = false,
  className,
}: RecordingTimerProps) {
  return (
    <span
      className={cn(
        "font-mono text-sm tabular-nums",
        isRecording ? "text-red-600" : "text-muted-foreground",
        className,
      )}
    >
      {isRecording && (
        <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
      )}
      {formatDuration(seconds)}
    </span>
  );
}
