# Final Translation & UI Audit

Date: 2026-05-30

## Executive summary

Translation was failing because **Groq is rate-limited (HTTP 429)** and the fallback chain returned **unchanged English text**. The frontend then displayed that English as if translation succeeded.

This pass adds **template + dictionary offline translation** for demo-critical strings, **frontend validation** so English is never shown when native script is expected, restricts the UI to **English / Hindi / Kannada only**, improves **sidebar delete visibility**, and documents **Sarvam native-script STT** behavior.

---

## Issue 1: Translation still failing

### Investigation

| Check | Result |
|-------|--------|
| Is translation API called? | **Yes** — `POST /api/v1/translation/translate` from `LocalizedText` / `translationService.ts` |
| Network response (before fix) | `200 OK` with `translated_text` **identical to English input** |
| Backend provider | Groq → StaticPhrase → Mock chain |
| Groq status | **429 rate limit** (`llama-3.3-70b-versatile`, daily token cap) |
| Static phrase provider | Miss on dynamic strings like `"Based on fever, bloody discharge, Mastitis…"` |
| Mock last-resort | Returned **English unchanged** (by design when not in explicit mock mode) |
| Frontend rendering | Displayed API response verbatim — no validation that output contained Devanagari/Kannada |

### Root cause

**Backend translation provider failure**, not frontend state management.

When Groq is unavailable, the fallback did not translate dynamic diagnosis copy. The frontend had no guard against “successful” HTTP responses that still contained English.

### Fix

#### Backend
- New `features/translation/services/template_translation.py`:
  - Matches gathering-intro pattern: `"Based on {symptoms}, {disease} is one possibility…"`
  - Uses `farmer_messages` Hindi/Kannada templates
  - Dictionary (`TERM_UI`) for common symptoms/diseases (fever, bloody discharge, Mastitis, FMD, etc.)
  - Reverse templates for Hindi/Kannada → English system strings
- `StaticPhraseTranslationProvider` tries templates **before** exact-phrase lookup
- `MockTranslationProvider` uses templates as last resort instead of silent English passthrough

#### Frontend
- New `lib/translation-utils.ts`:
  - `inferTextLanguage()` — script detection
  - `isTranslationSuccessful()` — rejects unchanged English for hi/kn targets
  - `needsClientTranslation()` — decides when to call API
- `LocalizedText` — bidirectional en↔hi↔kn; validates API output; logs source/target/translated text
- `translationService.ts` — always calls API when source ≠ target (including hi/kn → en)
- All assistant blocks use `LocalizedText`: text, disease analysis, first aid, diagnostic questions, SMS drafts

#### Languages restricted to demo set
Removed from UI: Telugu, Tamil, Malayalam, Urdu.

| File | Change |
|------|--------|
| `frontend/src/lib/languages.ts` | Only `en`, `hi`, `kn` |
| `frontend/src/types/translation.ts` | `LanguageCode = "en" \| "hi" \| "kn"` |
| `frontend/src/lib/voice-language.ts` | Supported list trimmed |
| `frontend/src/stores/conversationStore.ts` | `normalizeUiLanguage()` on rehydrate |

### Verified API output (after fix)

With Groq rate-limited, template fallback returns native script:

```
Groq translation failed (429)... using fallback provider ChainedTranslationProvider
Hindi OK: True
Kannada OK: True
```

Example input:
```
Based on fever, bloody discharge, Mastitis is one possibility. I need one more detail to narrow it down.
```

Example Hindi output (template):
```
बुखार, रक्तस्राव के आधार पर, स्तनाग्राह (मास्टाइटिस) एक संभावना है। मुझे इसे संकीर्ण करने के लिए एक और विवरण चाहिए।
```

### Browser console logs (expected)

```js
[translation] {
  source_language: "en",
  target_language: "hi",
  translated_text: "बुखार, रक्तस्राव के आधार पर…",
  success: true
}
[LocalizedText] {
  source_language: "en",
  target_language: "hi",
  translated_text: "…"
}
```

### Translation matrix (supported)

| Source | Target | Mechanism |
|--------|--------|-----------|
| English | Hindi | Groq or template + term dictionary |
| English | Kannada | Groq or template + term dictionary |
| Hindi | English | Template reverse lookup + Groq |
| Kannada | English | Template reverse lookup + Groq |

---

## Issue 2: Delete chat button

### Audit

Delete was implemented but **hard to discover**:
- Trash icon used `opacity-0` until hover
- Sidebar width 260px clipped long titles over action buttons

### Fix

| Change | Detail |
|--------|--------|
| Sidebar width | `260px` → **`300px`** (`ChatLayout.tsx`) |
| Trash icon | Always **60% opacity**, **100% on hover/active** |
| Overflow menu | Kept `⋮` for Rename + Delete |
| Title padding | `pr-16` so title does not overlap actions |
| Flow | Trash → confirmation dialog → `DELETE /api/v1/chat/{id}` → removed from Zustand store |

---

## Issue 3: Native language transcription (Sarvam)

### Audit

| Question | Answer |
|----------|--------|
| Does Sarvam return native script? | **Yes**, when `saarika:v2.5` + explicit `language_code` (`kn-IN`, `hi-IN`) |
| Does frontend convert/transliterate? | **No** — transcript is displayed as returned |
| Romanized output? | Only if Sarvam returns romanized text (auto-detect / wrong model) |

### Implementation (`sarvam_stt_provider.py`)

- UI language `kn` → Sarvam `kn-IN` + model **`saarika:v2.5`**
- UI language `hi` → Sarvam `hi-IN` + **`saarika:v2.5`**
- UI language `en` → `en-IN`
- Farmer-selected language is **authoritative** for downstream chat/TTS
- `input_audio_codec=webm` for browser recordings

### Expected behavior

| Speech | UI language | Expected transcript |
|--------|-------------|---------------------|
| Kannada | Kannada | Kannada script (e.g. `ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ`) |
| Hindi | Hindi | Devanagari (e.g. `मेरी गाय को बुखार`) |
| English | English | English text |

### Demo limitation

- **Auto-detect mode** (`saaras:v3` without `language_code`) may mis-detect or romanize — always select the correct UI language before voice input.
- Sarvam quality depends on mic clarity and API availability; no client-side script conversion is applied.

---

## Issue 4: Translation coverage

| Block type | Component | Status |
|------------|-----------|--------|
| Assistant text | `MessageRenderer` → `LocalizedText` | ✅ |
| Disease analysis | `DiseaseAnalysisCard` → `LocalizedText` on name, symptoms | ✅ |
| First aid | `FirstAidMessageCard` → `LocalizedText` per step | ✅ |
| Diagnostic question | `DiagnosticQuestionCard` → question + context | ✅ |
| SMS draft | `SmsAlertCard` → alert body | ✅ |

Backend also localizes on send via `localize_blocks()` in `chat_service.py` (same template chain when Groq fails).

---

## Files modified

### Backend
- `features/translation/services/template_translation.py` *(new)*
- `features/translation/services/static_translation_provider.py`
- `features/translation/services/mock_provider.py`
- `features/translation/tests/test_template_translation.py` *(new)*

### Frontend
- `lib/languages.ts`, `lib/translation-utils.ts` *(new)*, `lib/translation-utils.test.ts` *(new)*
- `lib/voice-language.ts`
- `types/translation.ts`
- `services/translationService.ts`
- `components/translation/LocalizedText.tsx`
- `components/chat/messages/MessageRenderer.tsx`
- `components/chat/layout/ChatLayout.tsx`
- `components/chat/sidebar/ConversationItem.tsx`
- `components/translation/TranslationDropdown.tsx`
- `stores/conversationStore.ts`

---

## Test results

| Suite | Result |
|-------|--------|
| `py -m pytest features/chat/tests/ features/translation/tests/` | **154 passed** |
| `npm test` (frontend) | **10 passed** |
| Live translation (Groq 429) | Hindi + Kannada native script via template fallback |

---

## Manual verification checklist

1. **Network tab**: Select Hindi → send message → see `POST /translation/translate` with Devanagari in response body.
2. **Console**: `[translation]` and `[LocalizedText]` logs show `success: true` and native script.
3. **Language dropdown**: Only English, Hindi, Kannada.
4. **Sidebar**: Trash icon visible on active chat; delete confirms and removes chat.
5. **Voice**: Select Kannada → speak Kannada → transcript in Kannada script (if Sarvam API key configured).

---

## Screenshots / logs

Screenshots are environment-specific. Capture after starting backend + frontend:

1. Hindi gathering intro in Devanagari (no English body).
2. Network tab: `/translation/translate` response with `translated_text` in native script.
3. Console: `[translation] success: true`.
4. Sidebar with visible trash icon on active conversation.

Backend log snippet (template fallback):
```
Groq translation failed (429)... using fallback provider ChainedTranslationProvider
Template translation target=hi src=en len=...
```

---

## Recommendations post-demo

1. Upgrade Groq tier or add IndicTrans/LibreTranslate for unconstrained dynamic text.
2. Expand `TERM_UI` dictionary from disease knowledge base.
3. Cache translations per message ID in `conversationStore.translatedResponses` to avoid repeat API calls on re-render.
