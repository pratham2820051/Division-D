"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ToastProps {
  message: string | null;
  durationMs?: number;
  onDismiss?: () => void;
  className?: string;
}

/** Lightweight ephemeral toast (no external dependency). */
export function Toast({
  message,
  durationMs = 2500,
  onDismiss,
  className,
}: ToastProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        className,
      )}
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  return {
    message,
    show: (text: string) => setMessage(text),
    dismiss: () => setMessage(null),
  };
}
