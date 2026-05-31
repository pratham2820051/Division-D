export {
  sendMessage,
  createChat,
  getChatHistory,
  ChatServiceError,
  type SendMessageRequest,
  type SendMessageResult,
} from "./chatService";

export {
  mapApiMessageToUi,
  mapSendResponseToMessages,
  extractPendingDiagnosticQuestion,
} from "./chatOrchestrator";

export {
  transcribeAudio,
  speakText,
  synthesizeSpeech,
  isVoiceServiceAvailable,
  releaseSpeakResult,
  type TranscribeResult,
  type SpeakResult,
} from "./voiceService";

export {
  translateText,
  getSupportedLanguages,
  type TranslateRequest,
} from "./translationService";
