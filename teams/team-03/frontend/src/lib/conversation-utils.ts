import type {
  Conversation,
  Message,
  MessageRole,
  SerializedConversation,
  SerializedMessage,
} from "@/types/conversation";
import type { MessageType } from "@/types/message";

const VALID_MESSAGE_TYPES = new Set<MessageType>([
  "text",
  "voice",
  "diagnostic_question",
  "disease_analysis",
  "first_aid",
  "sms_alert",
  "system",
]);

function normalizeMessageType(type: string | undefined): MessageType {
  if (type && VALID_MESSAGE_TYPES.has(type as MessageType)) {
    return type as MessageType;
  }
  return "text";
}

export function serializeMessage(message: Message): SerializedMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    type: message.type,
    payload: message.payload,
    speakableText: message.speakableText,
  };
}

export function deserializeMessage(raw: SerializedMessage): Message {
  const timestamp = new Date(raw.timestamp);
  return {
    id: raw.id,
    role: raw.role === "assistant" ? "assistant" : "user",
    content: typeof raw.content === "string" ? raw.content : "",
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
    type: normalizeMessageType(raw.type),
    payload: raw.payload ?? null,
    speakableText:
      typeof raw.speakableText === "string" ? raw.speakableText : raw.content,
  };
}

export function serializeConversation(
  conversation: Conversation,
): SerializedConversation {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map(serializeMessage),
    synced: conversation.synced,
    language: conversation.language,
  };
}

export function deserializeConversation(
  raw: SerializedConversation,
): Conversation {
  return {
    id: raw.id,
    title: raw.title,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    messages: raw.messages.map(deserializeMessage),
    synced: raw.synced,
    language: raw.language,
  };
}

export function deriveTitleFromMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 36 ? `${trimmed.slice(0, 36)}…` : trimmed;
}

export function createEmptyConversation(): Conversation {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
    synced: false,
  };
}

export function createMessage(
  role: MessageRole,
  content: string,
  options?: {
    type?: MessageType;
    payload?: Record<string, unknown> | null;
    speakableText?: string;
  },
): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    type: options?.type ?? "text",
    payload: options?.payload ?? null,
    speakableText: options?.speakableText ?? content,
  };
}

export function filterConversationsByQuery(
  conversations: Conversation[],
  query: string,
): Conversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return conversations;

  return conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          (m.speakableText?.toLowerCase().includes(q) ?? false),
      ),
  );
}

export function sortConversationsByRecent(
  conversations: Conversation[],
): Conversation[] {
  return [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

export function getMessageDisplayText(message: Message): string {
  return message.speakableText ?? message.content;
}

/** Combine assistant messages into one speakable summary for TTS. */
export function getAssistantSpeakableSummary(messages: Message[]): string {
  return messages
    .filter((m) => m.role === "assistant")
    .map(getMessageDisplayText)
    .filter(Boolean)
    .join(". ");
}
