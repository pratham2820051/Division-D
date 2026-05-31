/** Audio recording and playback helpers */

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, seconds);
  if (safe < 60) {
    return `${safe.toFixed(1)}s`;
  }
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function revokeAudioUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function getSupportedMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";
}

export function mapRecorderError(error: unknown): {
  code: "PERMISSION_DENIED" | "NOT_FOUND" | "NOT_SUPPORTED" | "UNKNOWN";
  message: string;
} {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return {
        code: "PERMISSION_DENIED",
        message: "Microphone access denied. Enable permissions in browser settings.",
      };
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        code: "NOT_FOUND",
        message: "No microphone found. Connect a mic and try again.",
      };
    }
    if (error.name === "NotSupportedError") {
      return {
        code: "NOT_SUPPORTED",
        message: "Recording is not supported in this browser.",
      };
    }
  }
  return {
    code: "UNKNOWN",
    message: "Could not access microphone. Please try again.",
  };
}

export async function queryMicPermission(): Promise<
  "prompt" | "granted" | "denied" | "unsupported"
> {
  if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
  try {
    const result = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return result.state as "prompt" | "granted" | "denied";
  } catch {
    return "prompt";
  }
}
