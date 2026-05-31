"use client";

import { useCallback } from "react";

import { useAutoVoiceReply } from "@/hooks/use-auto-voice-reply";
import { useActiveConversation, useConversations } from "@/hooks/use-conversations";
import { resolveDispatchMessageLanguage } from "@/lib/chat-dispatch-language";
import { getAssistantSpeakableSummary, createMessage } from "@/lib/conversation-utils";
import { extractPendingDiagnosticQuestion } from "@/services/chatOrchestrator";
import {
  ChatServiceError,
  createChat,
  sendMessage as sendChatMessage,
} from "@/services/chatService";
import { inferMessageLanguage, resolveConversationLanguage } from "@/lib/voice-language";
import { useConversationStore } from "@/stores/conversationStore";

async function ensureBackendChat(
  conversationId: string,
  synced: boolean | undefined,
): Promise<string> {
  if (synced) return conversationId;

  try {
    const created = await createChat();
    return created.id;
  } catch {
    return conversationId;
  }
}

export function useChatOrchestration() {
  const {
    activeConversation,
    messages,
    isLoading,
    isHydrated,
    activeConversationId,
  } = useActiveConversation();

  const {
    conversations,
    filteredConversations,
    searchQuery,
    language,
    error,
    autoPlayResponses,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    setSearchQuery,
    setVoiceModeOpen,
    setAutoPlayResponses,
  } = useConversations();

  const addMessage = useConversationStore((s) => s.addMessage);
  const addMessages = useConversationStore((s) => s.addMessages);
  const setLoading = useConversationStore((s) => s.setLoading);
  const setError = useConversationStore((s) => s.setError);
  const markConversationSynced = useConversationStore((s) => s.markConversationSynced);
  const persistConversationLanguage = useConversationStore(
    (s) => s.persistConversationLanguage,
  );
  const setPendingDiagnosticQuestion = useConversationStore(
    (s) => s.setPendingDiagnosticQuestion,
  );

  const autoVoice = useAutoVoiceReply();

  const dispatchMessage = useCallback(
    async (
      text: string,
      options?: {
        fromVoice?: boolean;
        skipUserOptimistic?: boolean;
        language?: string;
        voiceMetadata?: import("@/services/chatService").VoiceInputMetadata;
      },
    ): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = createConversation();
      }

      const conversation = conversations.find((c) => c.id === conversationId);

      const inferred = inferMessageLanguage(trimmed);
      const resolvedLanguage = resolveConversationLanguage(
        language,
        options?.voiceMetadata?.detected_language ?? inferred,
      );

      const messageLanguage = resolveDispatchMessageLanguage(
        conversation,
        resolvedLanguage,
        {
          language: resolvedLanguage,
          detectedLanguage: options?.voiceMetadata?.detected_language,
        },
      );

      const optimisticUser = createMessage("user", trimmed, {
        type: options?.fromVoice ? "voice" : "text",
      });

      if (!options?.skipUserOptimistic) {
        addMessage(conversationId, optimisticUser, trimmed);
      }
      setLoading(true);
      setError(null);

      try {
        const backendChatId = await ensureBackendChat(
          conversationId,
          conversation?.synced,
        );

        if (backendChatId !== conversationId) {
          markConversationSynced(conversationId, backendChatId);
          conversationId = backendChatId;
        } else if (!conversation?.synced) {
          markConversationSynced(conversationId);
        }

        const result = await sendChatMessage({
          message: trimmed,
          chat_id: conversationId,
          language: messageLanguage,
          fromVoice: options?.fromVoice,
          voiceMetadata: options?.voiceMetadata,
        });

        addMessages(conversationId, result.assistantMessages);

        const activeLanguage =
          result.response.language ?? messageLanguage;
        persistConversationLanguage(conversationId, activeLanguage as typeof language);

        const pending = extractPendingDiagnosticQuestion([
          ...messages,
          optimisticUser,
          ...result.assistantMessages,
        ]);
        setPendingDiagnosticQuestion(pending);

        if (autoPlayResponses && result.assistantMessages.length > 0) {
          const summary = getAssistantSpeakableSummary(result.assistantMessages);
          if (summary) {
            if (typeof console !== "undefined") {
              console.info("[voice:tts-request]", { textLength: summary.length });
            }
            await autoVoice.play(summary, activeLanguage);
          }
        }
      } catch (err) {
        const chatError =
          err instanceof ChatServiceError
            ? {
                message:
                  err.status === 404
                    ? "Chat session not found on server. Please retry."
                    : err.status === 0
                      ? "Cannot reach PashuMitra server. Check your connection."
                      : err.message,
                retryable: err.retryable,
                lastUserText: trimmed,
              }
            : {
                message: "Failed to send message. Please try again.",
                retryable: true,
                lastUserText: trimmed,
              };
        setError(chatError);
      } finally {
        setLoading(false);
      }
    },
    [
      activeConversationId,
      addMessage,
      addMessages,
      autoPlayResponses,
      autoVoice,
      conversations,
      createConversation,
      isLoading,
      language,
      markConversationSynced,
      persistConversationLanguage,
      messages,
      setError,
      setLoading,
      setPendingDiagnosticQuestion,
    ],
  );

  const sendMessage = useCallback(
    (text: string) => dispatchMessage(text),
    [dispatchMessage],
  );

  const sendVoiceMessage = useCallback(
    (text: string, voiceResult?: import("@/types/voice").TranscribeResult) => {
      const trimmed = text.trim();
      if (!trimmed) return Promise.resolve();

      const voiceLanguage = resolveConversationLanguage(
        language,
        voiceResult?.detectedLanguage ?? voiceResult?.language,
      );
      if (typeof console !== "undefined") {
        console.info("[voice:diagnosis-request]", {
          textLength: trimmed.length,
          language: voiceLanguage,
        });
      }
      return dispatchMessage(trimmed, {
        fromVoice: true,
        language: voiceLanguage,
        voiceMetadata: voiceResult
          ? {
              transcription_confidence: voiceResult.confidence,
              language_confidence: voiceResult.languageConfidence,
              requested_language: voiceResult.requestedLanguage ?? voiceLanguage,
              detected_language: voiceResult.detectedLanguage ?? voiceResult.language,
              fallback_used: voiceResult.fallbackUsed,
            }
          : undefined,
      }).then((result) => {
        if (typeof console !== "undefined") {
          console.info("[voice:diagnosis-complete]");
        }
        return result;
      });
    },
    [dispatchMessage, language],
  );

  const answerDiagnosticQuestion = useCallback(
    (answer: string) => dispatchMessage(answer),
    [dispatchMessage],
  );

  const retryLastMessage = useCallback(() => {
    if (!error?.lastUserText) return;
    setError(null);
    void dispatchMessage(error.lastUserText, { skipUserOptimistic: true });
  }, [dispatchMessage, error, setError]);

  return {
    conversations,
    filteredConversations,
    activeConversation,
    activeConversationId,
    searchQuery,
    isHydrated,
    messages,
    isLoading,
    error,
    language,
    autoPlayResponses,
    sendMessage,
    sendVoiceMessage,
    answerDiagnosticQuestion,
    retryLastMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    setSearchQuery,
    setVoiceModeOpen,
    setAutoPlayResponses,
    sessions: conversations,
    activeSession: activeConversation,
    activeSessionId: activeConversationId,
    createNewChat: createConversation,
    selectSession: selectConversation,
  };
}

/** @deprecated Use useChatOrchestration */
export const useChat = useChatOrchestration;
