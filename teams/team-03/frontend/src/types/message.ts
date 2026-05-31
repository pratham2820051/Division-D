import type { Severity } from "@/types/chat";

export type MessageType =
  | "text"
  | "voice"
  | "diagnostic_question"
  | "disease_analysis"
  | "first_aid"
  | "sms_alert"
  | "system";

export interface DiseaseCandidate {
  name: string;
  confidence: number;
  matchedSymptoms: string[];
  missingSymptoms: string[];
}

export interface DiseaseAnalysisPayload {
  diseases: DiseaseCandidate[];
  severity: Severity;
}

export interface DiagnosticQuestionPayload {
  question: string;
  context?: string | null;
  options?: string[];
}

export interface FirstAidPayload {
  instructions: string[];
  severity?: Severity | null;
}

export interface SmsAlertPayload {
  alertText: string;
  whatsappText?: string | null;
  recipientHint?: string;
  /** E.164 digits only, e.g. 919876543210 — optional vet WhatsApp number */
  recipientPhone?: string | null;
}

export type MessagePayload =
  | DiseaseAnalysisPayload
  | DiagnosticQuestionPayload
  | FirstAidPayload
  | SmsAlertPayload
  | Record<string, unknown>;

/** API message shape from backend */
export interface ApiMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  message_type: MessageType;
  payload?: Record<string, unknown> | null;
}

export interface SendMessageApiResponse {
  chat_id: string;
  user_message: ApiMessage;
  assistant_message: ApiMessage;
  assistant_messages: ApiMessage[];
  reply: string;
  severity: Severity;
  confidence: number;
  disease: string | null;
  first_aid: string | null;
  follow_up_question: string | null;
  language?: string;
}

export interface CreateChatApiResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}
