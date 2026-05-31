import type { Conversation, Message, MessageRole } from "@/types/conversation";

/** @deprecated Use Message from @/types/conversation */
export type ChatMessage = Message;

/** @deprecated Use Conversation from @/types/conversation */
export type ChatSession = Conversation;

export type { MessageRole };

export type Severity = "self_treatable" | "urgent" | "critical" | null;

export interface ChatResponse {
  session_id: string;
  reply: string;
  severity: Severity;
  confidence: number;
  disease: string | null;
  first_aid: string | null;
  follow_up_question: string | null;
}
