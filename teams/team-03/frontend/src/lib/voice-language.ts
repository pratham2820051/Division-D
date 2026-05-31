import type { LanguageCode } from "@/types/translation";
import { useConversationStore } from "@/stores/conversationStore";

export const LANGUAGE_CHANGE_EVENT = "pashumitra:language-change";

const SUPPORTED: LanguageCode[] = ["en", "hi", "kn"];

function normalizeLanguageCode(language?: string | null): LanguageCode | null {
  if (!language?.trim()) return null;
  const base = language.split("-")[0].toLowerCase() as LanguageCode;
  return SUPPORTED.includes(base) ? base : null;
}

export function inferMessageLanguage(message: string): LanguageCode | null {
  if (!message?.trim()) return null;
  if (/[\u0C80-\u0CFF]/.test(message)) return "kn";
  if (/[\u0900-\u097F]/.test(message)) return "hi";

  const tokens = new Set(message.toLowerCase().match(/[a-z]+/g) ?? []);
  const knHints = ["nanna", "hasu", "hasuvu", "hasuvige", "jwara", "bandide", "emme", "meke", "kuri"];
  const hiHints = ["meri", "gai", "gaay", "bukhar", "bhains", "bakri", "hai"];

  let kn = 0;
  let hi = 0;
  for (const t of tokens) {
    if (knHints.includes(t)) kn += 1;
    if (hiHints.includes(t)) hi += 1;
  }
  if (kn > hi && kn >= 1) return "kn";
  if (hi > kn && hi >= 1) return "hi";
  return null;
}

/**
 * Priority: user-selected UI language → STT/text detected language → English.
 */
export function resolveConversationLanguage(
  userSelected?: string | null,
  detected?: string | null,
): LanguageCode {
  const selected = normalizeLanguageCode(userSelected);
  const inferred = normalizeLanguageCode(detected);

  if (selected && selected !== "en") return selected;
  if (inferred) return inferred;
  if (selected) return selected;
  return "en";
}

/** Resolve TTS/STT language — prefer explicit hint, then live store value. */
export function resolveVoiceLanguage(explicit?: string): LanguageCode {
  if (explicit) return normalizeLanguageCode(explicit) ?? (explicit as LanguageCode);
  return useConversationStore.getState().language ?? "en";
}

export function stopAllVoicePlayback(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll("audio").forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}
