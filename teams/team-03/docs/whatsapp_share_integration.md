# WhatsApp Share Integration

PashuMitra AI shares veterinary alert drafts using WhatsApp’s official **Click to Chat** URLs (`wa.me`). No Twilio, Meta Business API, or server-side send is required—the farmer’s browser or device opens WhatsApp with the draft pre-filled.

---

## Overview

| Item | Detail |
|------|--------|
| Trigger | **Share on WhatsApp** button on the SMS / alert draft card |
| Message source | Current draft (`whatsapp_text` from API, or `alert_text` fallback) |
| URL (no vet phone) | `https://wa.me/?text=<encoded_draft>` |
| URL (with vet phone) | `https://wa.me/<phone>?text=<encoded_draft>` |
| Feedback | Toast: **Opening WhatsApp...** |
| APIs used | None (client-side navigation only) |

---

## Files modified

### Frontend

| File | Change |
|------|--------|
| `frontend/src/lib/whatsapp-share.ts` | URL building, phone normalization, `openWhatsAppShare()` |
| `frontend/src/lib/whatsapp-share.test.ts` | Unit tests for URL encoding and phone resolution |
| `frontend/src/lib/alert-text.ts` | (existing) Resolves draft text for share/copy |
| `frontend/src/components/chat/cards/SmsAlertCard.tsx` | Share button, WhatsApp icon, toast |
| `frontend/src/components/icons/WhatsAppIcon.tsx` | SVG WhatsApp mark |
| `frontend/src/components/ui/toast.tsx` | Lightweight success toast |
| `frontend/src/components/alerts/ShareToWhatsApp.tsx` | Reusable share button using same lib |
| `frontend/src/types/message.ts` | `recipientPhone` on `SmsAlertPayload` |
| `frontend/src/services/chatOrchestrator.ts` | Maps `recipient_phone` from API payload |
| `frontend/.env.local.example` | `NEXT_PUBLIC_VET_WHATSAPP_PHONE` |

### Backend

| File | Change |
|------|--------|
| `backend/features/chat/schemas/messages.py` | Optional `recipient_phone` on `SmsAlertPayload` |
| `backend/features/chat/services/chat_service.py` | Includes vet phone from settings in SMS draft payload |
| `backend/config/settings.py` | `VET_WHATSAPP_PHONE` setting |
| `backend/.env.example` | Documents `VET_WHATSAPP_PHONE` |

---

## Share URL generation

Implementation: `frontend/src/lib/whatsapp-share.ts`

```typescript
// Plain draft
buildWhatsAppShareUrl(message)
// → https://wa.me/?text=encodeURIComponent(message)

// With vet number
buildWhatsAppShareUrl(message, "919876543210")
// → https://wa.me/919876543210?text=encodeURIComponent(message)
```

Rules:

1. **Text** — Full WhatsApp-formatted alert (bold markers `*...*`, real line breaks). Encoded with `encodeURIComponent` (newlines become `%0A`).
2. **Phone** — Digits only (country code required, no `+` or spaces). Non-digits are stripped.
3. **Resolution order** — `payload.recipientPhone` from API → `NEXT_PUBLIC_VET_WHATSAPP_PHONE` env → generic `wa.me/?text=...`.

Backend optional config (`backend/.env`):

```env
VET_WHATSAPP_PHONE=919876543210
```

When the SMS draft is generated via `POST /api/v1/chat/{id}/sms-draft`, this value is attached as `recipient_phone` in the message payload.

---

## Mobile behavior

1. Farmer taps **Share on WhatsApp**.
2. Toast **Opening WhatsApp...** appears briefly.
3. Browser opens `wa.me` in a new tab/window (fallback: same-tab navigation if pop-up blocked).
4. **With WhatsApp installed:** OS usually deep-links to the app with the message composer filled.
5. **Without app:** Mobile browser may offer WhatsApp Web or store install.

Works on Android Chrome, iOS Safari, and in-app browsers that allow `wa.me` redirects.

---

## Desktop behavior

1. Same button and toast.
2. `window.open(url, "_blank")` opens a new tab.
3. **WhatsApp Web** loads (if logged in) with the draft in the message field.
4. Farmer picks a contact or uses a pre-filled vet chat when `recipient_phone` / `VET_WHATSAPP_PHONE` is set.

No desktop app is required; WhatsApp Web is sufficient.

---

## Configuration

| Variable | Where | Purpose |
|----------|--------|---------|
| `VET_WHATSAPP_PHONE` | `backend/.env` | Sent in SMS draft payload as `recipient_phone` |
| `NEXT_PUBLIC_VET_WHATSAPP_PHONE` | `frontend/.env.local` | Client fallback if payload has no phone |

Use E.164-style digits without `+`, e.g. `919876543210` for India.

---

## Testing

Frontend unit tests:

```bash
cd frontend
npm test -- whatsapp-share
```

Manual check:

1. Complete a diagnosis and generate SMS draft.
2. Click **Share on WhatsApp** — toast appears, WhatsApp opens with formatted alert.
3. Set `VET_WHATSAPP_PHONE` and regenerate draft — share should target that number.

---

## Security and privacy

- Sharing is **user-initiated**; nothing is sent until the farmer taps Send in WhatsApp.
- No message content is posted to PashuMitra servers for delivery.
- Vet phone numbers are configuration only, not validated against WhatsApp accounts.

---

## Related docs

- [WhatsApp Click to Chat FAQ](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat)
- Alert draft formatting: prior work in `SmsAlertService` (`whatsapp_message` field)
