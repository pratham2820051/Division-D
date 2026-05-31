import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  createEmptyConversation,
  deriveTitleFromMessage,
  deserializeConversation,
  filterConversationsByQuery,
  serializeConversation,
  sortConversationsByRecent,
} from "@/lib/conversation-utils";
import {
  LANGUAGE_CHANGE_EVENT,
  stopAllVoicePlayback,
} from "@/lib/voice-language";
import { normalizeUiLanguage } from "@/lib/languages";
import type {
  ChatErrorState,
  Conversation,
  ConversationStore,
  Message,
  SerializedConversation,
} from "@/types/conversation";
import type { DiagnosticQuestionPayload } from "@/types/message";
import type { LanguageCode } from "@/types/translation";

/** Stable empty array for Zustand selectors (never use `?? []` inline). */
export const EMPTY_MESSAGES: Message[] = [];

/** Avoid `localStorage is not defined` during Next.js server render. */
function createBrowserStorage() {
  return createJSONStorage(() => {
    if (typeof window === "undefined") {
      return {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      };
    }
    return window.localStorage;
  });
}

type PersistedSlice = {
  conversations: SerializedConversation[];
  activeConversationId: string | null;
  language: LanguageCode;
  autoPlayResponses: boolean;
};

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      searchQuery: "",
      isLoading: false,
      isHydrated: false,
      language: "en",
      voiceModeOpen: false,
      autoPlayResponses: false,
      translatedResponses: {},
      pendingDiagnosticQuestion: null,
      error: null,

      createConversation: () => {
        const conversation = createEmptyConversation();
        const language = get().language;
        conversation.language = language;
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
          searchQuery: "",
          error: null,
        }));
        return conversation.id;
      },

      selectConversation: (id) => {
        const conversation = get().conversations.find((c) => c.id === id);
        set({
          activeConversationId: id,
          error: null,
          language: conversation?.language ?? get().language,
        });
      },

      deleteConversation: (id) => {
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id);
          let nextActive = state.activeConversationId;

          if (state.activeConversationId === id) {
            nextActive = remaining[0]?.id ?? null;
          }

          return {
            conversations: remaining,
            activeConversationId: nextActive,
          };
        });
      },

      renameConversation: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, title: trimmed, updatedAt: new Date() }
              : c,
          ),
        }));
      },

      addMessage: (conversationId, message, titleFromFirstUser) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const isFirst = c.messages.length === 0;
            return {
              ...c,
              title:
                isFirst && titleFromFirstUser
                  ? deriveTitleFromMessage(titleFromFirstUser)
                  : c.title,
              messages: [...c.messages, message],
              updatedAt: new Date(),
            };
          }),
        }));
      },

      addMessages: (conversationId, messages) => {
        if (!messages.length) return;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, ...messages],
                  updatedAt: new Date(),
                }
              : c,
          ),
        }));
      },

      replaceMessages: (conversationId, messages) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages, updatedAt: new Date() }
              : c,
          ),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setLoading: (loading) => set({ isLoading: loading }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      setLanguage: (language) => {
        const previous = get().language;
        if (previous !== language) {
          stopAllVoicePlayback();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language } }),
            );
          }
        }
        set((state) => ({
          language,
          conversations: state.conversations.map((c) =>
            c.id === state.activeConversationId ? { ...c, language } : c,
          ),
        }));
      },

      persistConversationLanguage: (conversationId, language) => {
        set((state) => ({
          language:
            state.activeConversationId === conversationId
              ? language
              : state.language,
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, language } : c,
          ),
        }));
      },

      setVoiceModeOpen: (open) => set({ voiceModeOpen: open }),

      setTranslatedResponse: (messageId, language, text) => {
        set((state) => ({
          translatedResponses: {
            ...state.translatedResponses,
            [messageId]: {
              ...state.translatedResponses[messageId],
              [language]: text,
            },
          },
        }));
      },

      setPendingDiagnosticQuestion: (question: DiagnosticQuestionPayload | null) =>
        set({ pendingDiagnosticQuestion: question }),

      setError: (error: ChatErrorState | null) => set({ error }),

      setAutoPlayResponses: (enabled) => set({ autoPlayResponses: enabled }),

      markConversationSynced: (id, backendId) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== id && c.id !== backendId) return c;
            return {
              ...c,
              id: backendId ?? c.id,
              synced: true,
            };
          }),
          activeConversationId:
            state.activeConversationId === id
              ? (backendId ?? id)
              : state.activeConversationId,
        }));
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return (
          conversations.find((c) => c.id === activeConversationId) ?? null
        );
      },

      getFilteredConversations: () => {
        const { conversations, searchQuery } = get();
        return sortConversationsByRecent(
          filterConversationsByQuery(conversations, searchQuery),
        );
      },
    }),
    {
      name: "pashumitra-conversations",
      skipHydration: true,
      storage: createBrowserStorage(),
      partialize: (state): PersistedSlice => ({
        conversations: state.conversations.map(serializeConversation),
        activeConversationId: state.activeConversationId,
        language: state.language,
        autoPlayResponses: state.autoPlayResponses,
      }),
      merge: (persisted, current) => {
        const slice = persisted as PersistedSlice | undefined;
        if (!slice) return current;

        return {
          ...current,
          conversations: (slice.conversations ?? []).map(deserializeConversation),
          activeConversationId: slice.activeConversationId ?? null,
          language: normalizeUiLanguage(slice.language),
          autoPlayResponses: slice.autoPlayResponses ?? false,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const active = state.conversations.find(
            (c) => c.id === state.activeConversationId,
          );
          if (active?.language && active.language !== state.language) {
            state.language = active.language;
          }
        }
        state?.setHydrated(true);
      },
    },
  ),
);

/** Selector helpers for optimized re-renders */
export function selectActiveConversation(state: ConversationStore): Conversation | null {
  return (
    state.conversations.find((c) => c.id === state.activeConversationId) ??
    null
  );
}

export function selectActiveMessages(state: ConversationStore): Message[] {
  return selectActiveConversation(state)?.messages ?? EMPTY_MESSAGES;
}

export function selectChatError(state: ConversationStore) {
  return state.error;
}

export function selectPendingDiagnosticQuestion(state: ConversationStore) {
  return state.pendingDiagnosticQuestion;
}
