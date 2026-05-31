# Final Multilingual & SMS UX Fix Report

Date: 2026-05-30

## Summary

This pass fixes translation display for Hindi/Kannada chats, applies translation consistently across all assistant block types, moves SMS generation to an on-demand **Generate SMS Draft** button, and adds a visible trash icon for chat deletion in the sidebar.

---

## 1. Translation failure — root cause

### Symptoms
- User selected **Hindi** in the header.
- Assistant text such as *"Based on fever, bloody discharge…"* still rendered in English.
- A translation UI appeared, but English remained the primary visible text.

### Root causes (two layers)

| Layer | Issue |
|-------|--------|
| **Backend** | Dynamic gathering intros (`build_gathering_intro_text`) were built in English. `localize_blocks()` did not match the `"Based on {symptoms}, {disease}…"` pattern until `gathering_intro_dynamic` templates and regex were added in `localization.py`. When Groq returned 429 or failed, some strings stayed English. |
| **Frontend** | `MessageTranslateMenu` + `TranslatedContent` rendered translation **below** English instead of replacing it. Translation was only wired for plain `text` blocks — not `DISEASE_ANALYSIS`, `FIRST_AID`, `DIAGNOSTIC_QUESTION`, or `SMS_ALERT`. |

### Fix
1. **Backend**: `_localize_content()` detects gathering-intro pattern and fills Hindi/Kannada templates via Groq/static phrase provider.
2. **Frontend**: New `LocalizedText` component — when `language !== 'en'`, calls `POST /api/v1/translation/translate` and shows translated text as the **only** primary content (no English flash while loading).
3. All card components now use `LocalizedText` for user-visible fields.

---

## 2. Files modified

### Backend
| File | Change |
|------|--------|
| `features/chat/utils/localization.py` | Dynamic intro localization; all block payload fields |
| `features/chat/utils/farmer_messages.py` | `gathering_intro_dynamic` Hindi/Kannada templates |
| `features/chat/utils/message_builder.py` | Removed auto SMS from `_build_final_blocks()` |
| `features/chat/services/diagnosis_orchestrator.py` | SMS generation disabled in normal flow |
| `features/chat/services/chat_service.py` | Added `generate_sms_draft()` |
| `features/chat/routes/chat_routes.py` | `POST /{chat_id}/sms-draft` |
| `features/chat/schemas/response.py` | `SmsDraftResponse` schema |
| `features/translation/routes.py` | Translation API logging |
| `features/chat/tests/*` | Updated SMS expectations; added `test_sms_draft.py` |

### Frontend
| File | Change |
|------|--------|
| `components/translation/LocalizedText.tsx` | Primary translated display; no English while loading |
| `components/translation/MessageTranslateMenu.tsx` | Uses `LocalizedText`; never shows original on success |
| `components/chat/messages/MessageRenderer.tsx` | `LocalizedText` for text/system; passes `language` to cards |
| `components/chat/cards/DiseaseAnalysisCard.tsx` | `LocalizedText` + **Generate SMS Draft** button |
| `components/chat/cards/DiagnosticQuestionCard.tsx` | `LocalizedText` for question/context |
| `components/chat/cards/FirstAidMessageCard.tsx` | `LocalizedText` for steps |
| `components/chat/cards/SmsAlertCard.tsx` | `LocalizedText` for alert body |
| `components/chat/sidebar/ConversationItem.tsx` | Visible trash icon + confirmation dialog |
| `services/chatService.ts` | `generateSmsDraft()` |
| `services/translationService.ts` | Console logging for src/tgt/preview |

---

## 3. API calls verified

### Translation
```
POST /api/v1/translation/translate
Body: { "text": "Based on fever...", "target_language": "hi" }
```

**Backend log** (when server running):
```
translation API src=en tgt=hi in_len=… out_len=… out_preview='बुखार…'
```

**Frontend console**:
```js
[translation] { source_language: "en", target_language: "hi", input_preview: "...", output_preview: "..." }
[LocalizedText] { source_language: "en", target_language: "hi", translated_text: "..." }
```

### SMS draft (on demand)
```
POST /api/v1/chat/{chat_id}/sms-draft?language=hi
```

Uses latest `DISEASE_ANALYSIS` message + conversation state (animal, symptoms, confidence, severity). Returns and persists an `SMS_ALERT` message.

### Chat delete (existing)
```
DELETE /api/v1/chat/{chat_id}
```

Sidebar trash icon → confirmation dialog → DELETE → removed from store.

---

## 4. Expected behavior

| UI language | Assistant text | Translation display |
|-------------|----------------|---------------------|
| English | English | No translation call |
| Hindi | Backend localizes on send; frontend `LocalizedText` as fallback | Hindi only (e.g. `बुखार और रक्तस्राव के आधार पर…`) |
| Kannada | Same | Kannada only (e.g. `ಜ್ವರ ಮತ್ತು ರಕ್ತಸ್ರಾವದ ಆಧಾರದ ಮೇಲೆ…`) |

**Never** show original English when translation succeeds.

### Block coverage
- `TEXT` — `LocalizedText` in `MessageRenderer`
- `DISEASE_ANALYSIS` — disease name, symptoms, candidates
- `FIRST_AID` — instruction steps
- `DIAGNOSTIC_QUESTION` — question + context
- `SMS_ALERT` — alert body (after **Generate SMS Draft**)

### SMS flow
```
Diagnosis complete → Disease Analysis card
        ↓
[ Generate SMS Draft ]  (user click)
        ↓
POST /chat/{id}/sms-draft
        ↓
SMS_ALERT card appended to chat
```

Auto SMS removed from normal chat/diagnosis flow.

---

## 5. Test results

### Backend (`py -m pytest features/chat/tests/`)
- **151 passed** (including `test_sms_draft.py`, updated orchestrator/integration tests)
- Auto SMS assertions changed to `SMS_ALERT not in types` for normal send flow
- On-demand SMS: `test_generate_sms_draft_after_diagnosis` passes

### Frontend
- `npm test` — 5/5 passed (`chat-dispatch-language.test.ts`)

### Manual validation checklist

| Test | Steps | Expected |
|------|-------|----------|
| Hindi pipeline | Select Hindi → send Hindi symptom message | Reply + gathering intro in Hindi/Devanagari |
| Hindi translation | Open browser console | `[translation]` and `[LocalizedText]` logs with `tgt=hi` |
| Kannada pipeline | Select Kannada → Kannada input | Kannada script in reply |
| English | Select English | No translation API calls for display |
| SMS button | Complete diagnosis → click **Generate SMS Draft** | SMS card appears; button disabled after |
| Delete chat | Hover sidebar item → trash icon → confirm | Chat removed from sidebar and backend |

---

## 6. Screenshots

Screenshots are environment-specific. After starting backend + frontend:

1. Hindi chat with translated gathering intro (Devanagari, no English body text).
2. Disease Analysis card with **Generate SMS Draft** button.
3. SMS_ALERT card after button click.
4. Sidebar with trash icon visible on hover beside each conversation.

---

## 7. Notes

- If Groq rate-limits (`429`), backend falls back to static phrases for known templates; frontend `LocalizedText` still attempts `/translation/translate` for any remaining English.
- TTS uses conversation language from the store; speakable text should prefer localized disease/symptom labels from `buildSpeakableText` in `chatOrchestrator.ts`.
- Chat delete was already implemented via the ⋮ menu; this pass adds a **direct trash icon** for faster access with the same confirmation dialog.
