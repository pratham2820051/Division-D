import { ApiError, apiFetch } from "@/lib/api-client";
import {
  mapApiMessageToUi,
  mapSendResponseToMessages,
} from "@/services/chatOrchestrator";
import type { Message } from "@/types/conversation";
import type {
  CreateChatApiResponse,
  SendMessageApiResponse,
} from "@/types/message";

export interface VoiceInputMetadata {
  transcription_confidence: number;
  language_confidence: number;
  requested_language?: string | null;
  detected_language?: string | null;
  fallback_used?: boolean;
}

export interface SendMessageRequest {
  message: string;
  chat_id: string;
  language?: string;
  /** Mark message as voice-originated for backend typing */
  fromVoice?: boolean;
  voiceMetadata?: VoiceInputMetadata;
}

export interface SendMessageResult {
  userMessage: Message;
  assistantMessages: Message[];
  response: SendMessageApiResponse;
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

function toChatError(error: unknown): ChatServiceError {
  if (error instanceof ApiError) {
    return new ChatServiceError(error.message, error.status, error.retryable);
  }
  if (error instanceof Error) {
    return new ChatServiceError(error.message, 0, true);
  }
  return new ChatServiceError("Chat request failed", 0, true);
}

export async function createChat(title = "New chat"): Promise<CreateChatApiResponse> {
  try {
    return await apiFetch<CreateChatApiResponse>("/api/v1/chat/create", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  } catch (error) {
    throw toChatError(error);
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    await apiFetch<{ chat_id: string }>(`/api/v1/chat/${chatId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return;
    }
    throw toChatError(error);
  }
}

export async function sendMessage(
  request: SendMessageRequest,
): Promise<SendMessageResult> {
  const body: Record<string, unknown> = {
    message: request.fromVoice ? `[voice]${request.message}` : request.message,
    language: request.language ?? "en",
  };
  if (request.fromVoice && request.voiceMetadata) {
    body.voice_metadata = request.voiceMetadata;
  }

  try {
    const response = await apiFetch<SendMessageApiResponse>(
      `/api/v1/chat/${request.chat_id}/message`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    const mapped = mapSendResponseToMessages(response);

    return {
      ...mapped,
      response,
    };
  } catch (error) {
    throw toChatError(error);
  }
}

export async function getChatHistory(chatId: string): Promise<Message[]> {
  try {
    const detail = await apiFetch<{
      messages: SendMessageApiResponse["user_message"][];
    }>(`/api/v1/chat/${chatId}`);
    return detail.messages.map(mapApiMessageToUi);
  } catch (error) {
    throw toChatError(error);
  }
}

export interface SmsDraftResult {
  chatId: string;
  assistantMessage: Message;
  language: string;
}

export async function generateSmsDraft(
  chatId: string,
  language = "en",
): Promise<SmsDraftResult> {
  try {
    const data = await apiFetch<{
      chat_id: string;
      assistant_message: SendMessageApiResponse["assistant_message"];
      language: string;
    }>(`/api/v1/chat/${chatId}/sms-draft?language=${encodeURIComponent(language)}`, {
      method: "POST",
    });
    return {
      chatId: data.chat_id,
      assistantMessage: mapApiMessageToUi(data.assistant_message),
      language: data.language,
    };
  } catch (error) {
    throw toChatError(error);
  }
}

/** @deprecated Use chat_id */
export type { SendMessageRequest as LegacySendMessageRequest };
