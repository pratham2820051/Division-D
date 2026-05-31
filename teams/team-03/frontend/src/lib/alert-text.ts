/** Normalize alert strings that may contain literal \\n from older API payloads. */
export function normalizeAlertNewlines(text: string): string {
  return text.replace(/\\n/g, "\n");
}

/** Prefer WhatsApp-formatted draft; fall back to plain alert text. */
export function getWhatsAppAlertText(payload: {
  alertText: string;
  whatsappText?: string | null;
}): string {
  const raw = payload.whatsappText?.trim() || payload.alertText;
  return normalizeAlertNewlines(raw);
}
