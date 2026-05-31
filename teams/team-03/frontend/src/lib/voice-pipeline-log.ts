/** Structured console logs for voice pipeline debugging (demo). */

type VoiceLogPayload = Record<string, unknown>;

export function voiceLog(stage: string, payload?: VoiceLogPayload): void {
  if (typeof console === "undefined") return;
  console.info(`[voice:${stage}]`, payload ?? {});
}

export const VOICE_UNCLEAR_MESSAGE =
  "I could not understand the audio. Please try again.";

export const VOICE_TOO_SHORT_MESSAGE =
  "Recording was too short. Hold the mic, speak clearly, then tap stop.";
