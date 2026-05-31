import { resolveConversationLanguage } from "@/lib/voice-language";
import type { LanguageCode } from "@/types/translation";
import type { Conversation } from "@/types/conversation";

/** Resolve chat/TTS language after the active conversation record is known. */
export function resolveDispatchMessageLanguage(
  conversation: Conversation | null | undefined,
  storeLanguage: LanguageCode,
  options?: {
    language?: string;
    detectedLanguage?: string | null;
  },
): LanguageCode {
  const conversationLanguage =
    options?.language ?? conversation?.language ?? storeLanguage;

  return resolveConversationLanguage(
    conversationLanguage,
    options?.detectedLanguage,
  );
}
