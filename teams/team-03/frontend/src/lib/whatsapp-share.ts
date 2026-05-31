/**
 * Build wa.me share links — no Meta/Twilio APIs; opens WhatsApp app or Web.
 * @see https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat
 */

const WHATSAPP_BASE = "https://wa.me";

/** Strip formatting; keep digits only for wa.me path segment. */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Resolve vet phone: payload from API first, then public env fallback.
 */
export function resolveVetWhatsAppPhone(
  payloadPhone: string | null | undefined,
  envPhone: string | null | undefined = process.env.NEXT_PUBLIC_VET_WHATSAPP_PHONE,
): string {
  const fromPayload = normalizeWhatsAppPhone(payloadPhone);
  if (fromPayload) return fromPayload;
  return normalizeWhatsAppPhone(envPhone);
}

/**
 * Build share URL:
 * - With phone: https://wa.me/<phone>?text=<encoded>
 * - Without:    https://wa.me/?text=<encoded>
 */
export function buildWhatsAppShareUrl(
  message: string,
  phone?: string | null,
): string {
  const encoded = encodeURIComponent(message);
  const digits = normalizeWhatsAppPhone(phone);
  if (digits) {
    return `${WHATSAPP_BASE}/${digits}?text=${encoded}`;
  }
  return `${WHATSAPP_BASE}/?text=${encoded}`;
}

/**
 * Open WhatsApp share in a new tab/window.
 * Desktop: WhatsApp Web. Mobile: often deep-links to the installed app.
 */
export function openWhatsAppShare(url: string): void {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
}

export function shareAlertOnWhatsApp(
  message: string,
  phone?: string | null,
): string {
  const url = buildWhatsAppShareUrl(message, phone);
  openWhatsAppShare(url);
  return url;
}
