import type { LanguageCode } from "@/types/translation";
import type {
  DiagnosticQuestionPayload,
  MessageType,
} from "@/types/message";

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type: MessageType;
  payload?: Record<string, unknown> | null;
  /** Plain-text summary for search, TTS, and translation */
  speakableText?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  /** Whether this conversation exists on the backend */
  synced?: boolean;
  /** UI / voice / diagnosis language for this chat */
  language?: LanguageCode;
}

/** Serializable shapes for Zustand persist / localStorage */
export interface SerializedMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  type?: MessageType;
  payload?: Record<string, unknown> | null;
  speakableText?: string;
}

export interface SerializedConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: SerializedMessage[];
  synced?: boolean;
  language?: LanguageCode;
}

export interface ChatErrorState {
  message: string;
  retryable: boolean;
  lastUserText?: string;
}

export interface ConversationStoreState {
  conversations: Conversation[];
  activeConversationId: string | null;
  searchQuery: string;
  isLoading: boolean;
  isHydrated: boolean;
  language: LanguageCode;
  voiceModeOpen: boolean;
  translatedResponses: Record<string, Record<string, string>>;
  pendingDiagnosticQuestion: DiagnosticQuestionPayload | null;
  error: ChatErrorState | null;
  autoPlayResponses: boolean;
}

export interface ConversationStoreActions {
  createConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addMessage: (conversationId: string, message: Message, titleFromFirstUser?: string) => void;
  addMessages: (conversationId: string, messages: Message[]) => void;
  replaceMessages: (conversationId: string, messages: Message[]) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setLanguage: (language: LanguageCode) => void;
  /** Persist language on the active conversation after each chat turn. */
  persistConversationLanguage: (conversationId: string, language: LanguageCode) => void;
  setVoiceModeOpen: (open: boolean) => void;
  setTranslatedResponse: (messageId: string, language: LanguageCode, text: string) => void;
  setPendingDiagnosticQuestion: (question: DiagnosticQuestionPayload | null) => void;
  setError: (error: ChatErrorState | null) => void;
  setAutoPlayResponses: (enabled: boolean) => void;
  markConversationSynced: (id: string, backendId?: string) => void;
  getActiveConversation: () => Conversation | null;
  getFilteredConversations: () => Conversation[];
}

export type ConversationStore = ConversationStoreState & ConversationStoreActions;
