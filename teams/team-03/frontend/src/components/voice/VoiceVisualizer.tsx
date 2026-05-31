"use client";

import { cn } from "@/lib/utils";

interface VoiceVisualizerProps {
  levels: number[];
  isActive?: boolean;
  barCount?: number;
  className?: string;
  variant?: "default" | "orb";
}

export function VoiceVisualizer({
  levels,
  isActive = false,
  className,
  variant = "default",
}: VoiceVisualizerProps) {
  if (variant === "orb") {
    return (
      <div
        className={cn(
          "relative flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40",
          className,
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 via-emerald-600/20 to-teal-500/30 blur-xl transition-opacity duration-500",
            isActive ? "opacity-100 animate-pulse" : "opacity-40",
          )}
        />
        <div
          className={cn(
            "absolute inset-2 rounded-full border border-emerald-500/20 bg-gradient-to-b from-emerald-950/80 to-zinc-950/90 shadow-2xl",
            isActive && "shadow-emerald-500/20",
          )}
        />
        <div className="relative flex h-16 items-end justify-center gap-[3px] sm:h-20">
          {levels.slice(0, 20).map((level, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-300 transition-all duration-75 sm:w-1.5"
              style={{
                height: `${Math.max(8, level * 64)}px`,
                opacity: isActive ? 0.85 + level * 0.15 : 0.35,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-12 items-end justify-center gap-[3px] rounded-xl bg-muted/40 px-4 py-2",
        className,
      )}
      aria-hidden
    >
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-75 sm:w-1.5",
            isActive
              ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
              : "bg-muted-foreground/30",
          )}
          style={{ height: `${Math.max(4, level * 40)}px` }}
        />
      ))}
    </div>
  );
}
