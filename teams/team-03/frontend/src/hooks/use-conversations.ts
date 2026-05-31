"use client";

import { useCallback, useEffect, useMemo } from "react";

import {
  filterConversationsByQuery,
  sortConversationsByRecent,
} from "@/lib/conversation-utils";
import { getChatHistory } from "@/services/chatService";
import {
  EMPTY_MESSAGES,
  selectActiveConversation,
  useConversationStore,
} from "@/stores/conversationStore";

export function useConversations() {
  const conversations = useConversationStore((s) => s.conversations);
  const searchQuery = useConversationStore((s) => s.searchQuery);
  const filteredConversations = useMemo(
    () =>
      sortConversationsByRecent(
        filterConversationsByQuery(conversations, searchQuery),
      ),
    [conversations, searchQuery],
  );
  const activeConversation = useConversationStore(selectActiveConversation);
  const activeConversationId = useConversationStore(
    (s) => s.activeConversationId,
  );
  const isLoading = useConversationStore((s) => s.isLoading);
  const isHydrated = useConversationStore((s) => s.isHydrated);
  const language = useConversationStore((s) => s.language);
  const error = useConversationStore((s) => s.error);
  const voiceModeOpen = useConversationStore((s) => s.voiceModeOpen);
  const autoPlayResponses = useConversationStore((s) => s.autoPlayResponses);

  const createConversation = useConversationStore((s) => s.createConversation);
  const selectConversationStore = useConversationStore((s) => s.selectConversation);
  const replaceMessages = useConversationStore((s) => s.replaceMessages);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const renameConversation = useConversationStore((s) => s.renameConversation);
  const setSearchQuery = useConversationStore((s) => s.setSearchQuery);
  const setLanguage = useConversationStore((s) => s.setLanguage);
  const setVoiceModeOpen = useConversationStore((s) => s.setVoiceModeOpen);
  const setAutoPlayResponses = useConversationStore((s) => s.setAutoPlayResponses);

  const selectConversation = useCallback(
    async (id: string) => {
      selectConversationStore(id);
      const conv = useConversationStore
        .getState()
        .conversations.find((c) => c.id === id);
      if (!conv?.synced) return;

      try {
        const serverMessages = await getChatHistory(id);
        replaceMessages(id, serverMessages);
      } catch {
        // Keep local messages if server fetch fails
      }
    },
    [replaceMessages, selectConversationStore],
  );

  return {
    conversations,
    filteredConversations,
    activeConversation,
    activeConversationId,
    searchQuery,
    isLoading,
    isHydrated,
    language,
    error,
    voiceModeOpen,
    autoPlayResponses,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    setSearchQuery,
    setLanguage,
    setVoiceModeOpen,
    setAutoPlayResponses,
  };
}

export function useActiveConversation() {
  const activeConversation = useConversationStore(selectActiveConversation);
  const messages = useMemo(
    () => activeConversation?.messages ?? EMPTY_MESSAGES,
    [activeConversation],
  );
  const isLoading = useConversationStore((s) => s.isLoading);
  const isHydrated = useConversationStore((s) => s.isHydrated);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);

  return { activeConversation, messages, isLoading, isHydrated, activeConversationId };
}

/** Ensures Zustand persist has rehydrated from localStorage */
export function useConversationHydration() {
  const isHydrated = useConversationStore((s) => s.isHydrated);
  const setHydrated = useConversationStore((s) => s.setHydrated);

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useConversationStore.persist.onFinishHydration(finish);

    if (useConversationStore.persist.hasHydrated()) {
      finish();
    } else {
      void useConversationStore.persist.rehydrate();
    }

    return unsub;
  }, [setHydrated]);

  return isHydrated;
}

/** @deprecated Use useConversations instead */
export const useChatSessions = useConversations;
