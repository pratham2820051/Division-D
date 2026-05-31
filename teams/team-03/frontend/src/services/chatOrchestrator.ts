import type {
  ApiMessage,
  DiagnosticQuestionPayload,
  DiseaseAnalysisPayload,
  FirstAidPayload,
  MessageType,
  SendMessageApiResponse,
  SmsAlertPayload,
} from "@/types/message";
import type { Message } from "@/types/conversation";

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function normalizePayload(
  messageType: MessageType,
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!payload) return null;

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    normalized[snakeToCamelKey(key)] = value;
  }

  if (messageType === "disease_analysis" && Array.isArray(normalized.diseases)) {
    normalized.diseases = (normalized.diseases as Record<string, unknown>[]).map(
      (d) => ({
        name: d.name,
        confidence: d.confidence,
        matchedSymptoms: d.matched_symptoms ?? d.matchedSymptoms ?? [],
        missingSymptoms: d.missing_symptoms ?? d.missingSymptoms ?? [],
      }),
    );
  }

  if (messageType === "first_aid" && normalized.instructions) {
    // already camelCase
  }

  if (messageType === "sms_alert") {
    if (normalized.alert_text && !normalized.alertText) {
      normalized.alertText = normalized.alert_text;
    }
    if (normalized.whatsapp_text && !normalized.whatsappText) {
      normalized.whatsappText = normalized.whatsapp_text;
    }
    if (normalized.recipient_hint && !normalized.recipientHint) {
      normalized.recipientHint = normalized.recipient_hint;
    }
    if (normalized.recipient_phone && !normalized.recipientPhone) {
      normalized.recipientPhone = normalized.recipient_phone;
    }
  }

  return normalized;
}

function buildSpeakableText(
  messageType: MessageType,
  content: string,
  payload: Record<string, unknown> | null,
): string {
  switch (messageType) {
    case "disease_analysis": {
      const p = payload as unknown as DiseaseAnalysisPayload;
      const top = p?.diseases?.[0];
      if (!top) return content;
      const symptoms = top.matchedSymptoms?.slice(0, 3).join(", ");
      return [top.name, symptoms].filter(Boolean).join(". ");
    }
    case "first_aid": {
      const p = payload as unknown as FirstAidPayload;
      return p?.instructions?.join(". ") ?? content;
    }
    case "sms_alert": {
      const p = payload as unknown as SmsAlertPayload;
      return p?.alertText ?? content;
    }
    case "diagnostic_question": {
      const p = payload as unknown as DiagnosticQuestionPayload;
      return p?.question ?? content;
    }
    default:
      return content;
  }
}

export function mapApiMessageToUi(api: ApiMessage): Message {
  const messageType = (api.message_type ?? "text") as MessageType;
  const payload = normalizePayload(messageType, api.payload);

  return {
    id: api.id,
    role: api.role,
    content: api.content,
    timestamp: new Date(api.timestamp),
    type: messageType,
    payload,
    speakableText: buildSpeakableText(messageType, api.content, payload),
  };
}

export function mapSendResponseToMessages(
  response: SendMessageApiResponse,
): { userMessage: Message; assistantMessages: Message[] } {
  const userMessage = mapApiMessageToUi(response.user_message);
  const assistantMessages = (response.assistant_messages ?? [response.assistant_message])
    .map(mapApiMessageToUi);

  return { userMessage, assistantMessages };
}

export function extractPendingDiagnosticQuestion(
  messages: Message[],
): DiagnosticQuestionPayload | null {
  const last = [...messages].reverse().find((m) => m.type === "diagnostic_question");
  if (!last?.payload) return null;
  return last.payload as unknown as DiagnosticQuestionPayload;
}
