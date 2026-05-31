import {
  defaultConversationId,
  mockConversations,
  sampleMessages,
} from "@/lib/mockConversations";
import type { ChatResponse } from "@/types/chat";
import type { LanguageCode } from "@/types/translation";

/** Simple message shape for quick UI prototyping */
export const messages = sampleMessages;

/** @deprecated Use mockConversations from @/lib/mockConversations */
export const mockChatSessions = mockConversations;

/** @deprecated Use defaultConversationId */
export const defaultSessionId = defaultConversationId;

/** Mock AI replies keyed by keywords (fallback used by chatService) */
export const mockChatReplies: Record<string, string> = {
  fever:
    "Possible disease: Foot-and-Mouth Disease (FMD).\n\nSeverity: Urgent\nConfidence: 72%\n\nCheck for mouth sores, drooling, and lameness. Isolate the animal and contact a veterinarian.",
  cow:
    "Thank you for the details about your cow. How long have the symptoms been present? Is there fever, loss of appetite, or difficulty breathing?",
  goat:
    "For goat health issues, please describe any swelling, lameness, or discharge. How old is the goat and what symptoms started first?",
  buffalo:
    "Buffalo weakness can have several causes. Is the animal eating normally? Any fever, diarrhea, or change in milk production?",
  default:
    "Thank you for sharing. Could you tell me the animal type, age, and how long these symptoms have been present? This will help narrow down the diagnosis.",
};

export function buildMockChatResponse(
  userMessage: string,
  sessionId: string,
): ChatResponse {
  const lower = userMessage.toLowerCase();
  let reply = mockChatReplies.default;

  for (const [keyword, text] of Object.entries(mockChatReplies)) {
    if (keyword !== "default" && lower.includes(keyword)) {
      reply = text;
      break;
    }
  }

  const isFever = lower.includes("fever");
  const isCritical =
    lower.includes("breathing") || lower.includes("collapse");

  return {
    session_id: sessionId,
    reply,
    severity: isCritical ? "critical" : isFever ? "urgent" : "self_treatable",
    confidence: isFever ? 0.78 : 0.55,
    disease: isFever ? "Foot-and-Mouth Disease (FMD)" : null,
    first_aid: isFever
      ? "Isolate the animal, provide clean water, and contact a vet within 24 hours."
      : null,
    follow_up_question: reply.includes("?")
      ? null
      : "Can you describe any other symptoms?",
  };
}

export const mockTranslations: Partial<
  Record<LanguageCode, (text: string) => string>
> = {
  kn: (text) =>
    `[ಕನ್ನಡ] ${text.replace("Possible disease", "ಸಂಭವನೀಯ ರೋಗ").replace("Severity", "ತೀವ್ರತೆ").replace("Urgent", "ತುರ್ತು")}`,
  hi: (text) =>
    `[हिन्दी] ${text.replace("Possible disease", "संभावित रोग").replace("Severity", "गंभीरता").replace("Urgent", "तत्काल")}`,
};

export const mockTranscriptions = [
  "My cow has fever since yesterday",
  "Goat has swelling in the leg",
  "Buffalo is weak and not eating properly",
];

export const MOCK_API_DELAY_MS = 800;

export async function mockDelay(ms = MOCK_API_DELAY_MS): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
