# Multilingual Conversation Validation Report

**Date:** 2026-05-30  
**Scope:** End-to-end language preservation for Kannada, Hindi, and English farmers using Sarvam STT + Edge TTS.

## Goal

A farmer should speak or type entirely in Kannada, Hindi, or English and receive diagnosis, follow-up questions, first aid, guardrails, and voice replies in the **same language** — without silent conversion to English.

---

## Language Flow Diagram

```mermaid
flowchart TD
  subgraph Frontend
    A[Language dropdown / conversation.language]
    B[VoiceMode + useVoiceTranscription]
    C[POST /voice/transcribe language=kn|hi|en]
    D[POST /chat/message language + voice_metadata]
    E[Auto-play TTS with conversation.language]
  end

  subgraph STT["Sarvam STT"]
    F[saarika:v2.5 + language_code kn-IN / hi-IN / en-IN]
    G[Native script transcript]
  end

  subgraph Backend
    H[resolve_conversation_language]
    I[ChatOrchestrator — English internal templates]
    J[localize_blocks + farmer_messages]
    K[Persist localized assistant messages]
  end

  subgraph TTS["Edge TTS"]
    L[EDGE_VOICE_BY_LANGUAGE]
    M[kn-IN-SapnaNeural / hi-IN-SwaraNeural / en-IN-NeerjaNeural]
  end

  A --> B
  B --> C --> F --> G
  G --> D
  A --> D
  D --> H --> I --> J --> K
  K --> E --> L --> M
```

### Language resolution priority

| Priority | Source | Example |
|----------|--------|---------|
| 1 | User-selected UI / `conversation.language` | Dropdown set to **Kannada** |
| 2 | Sarvam detected language (voice metadata) | STT returns `kn` when UI unset |
| 3 | English fallback | No hint and no detection |

Implementation: `backend/features/chat/utils/conversation_language.py`, `frontend/src/lib/voice-language.ts`.

---

## Pipeline Stages

### 1. Speech-to-text (Sarvam)

| UI language | Sarvam model | BCP-47 code | Output script |
|-------------|--------------|-------------|---------------|
| `kn` | `saarika:v2.5` | `kn-IN` | Kannada |
| `hi` | `saarika:v2.5` | `hi-IN` | Devanagari |
| `en` | `saarika:v2.5` | `en-IN` | English |

When the farmer selects a language, that choice is **authoritative** for STT and downstream chat (see `sarvam_stt_provider.py`).

**Example log line:**

```
Sarvam STT model=saarika:v2.5 requested=kn sarvam_code=kn-IN detected=kn transcript_len=24 ...
```

### 2. Diagnosis (internal vs farmer-facing)

| Layer | Language | Notes |
|-------|----------|-------|
| Symptom extraction / RAG matching | English canonical labels | Internal only — not shown to farmer |
| Orchestrator templates | English source | Translated before response |
| Farmer-visible blocks | `conversation.language` | TEXT, questions, disease names, symptoms, first aid, SMS |

Localization: `localize_blocks()` + pre-localized `farmer_messages` for system strings (voice unclear, guardrail, language mismatch).

### 3. Text-to-speech (Edge TTS)

| Language | Edge voice | Never used for other langs |
|----------|------------|----------------------------|
| `en` | `en-IN-NeerjaNeural` | Yes |
| `hi` | `hi-IN-SwaraNeural` | Yes |
| `kn` | `kn-IN-SapnaNeural` | Yes |

**Example log line:**

```
Edge TTS language=kn voice=kn-IN-SapnaNeural text_len=42
TTS speak language=kn voice=kn-IN-SapnaNeural duration=3.0s
```

Response headers: `X-TTS-Voice`, `X-TTS-Language`.

Frontend `buildSpeakableText()` uses localized disease name + symptoms (no English “Possible disease:” wrapper).

---

## Validation Matrix

| Scenario | STT / input | Assistant reply | TTS voice | Test |
|----------|-------------|-----------------|-----------|------|
| Kannada voice | Kannada script | Kannada | `kn-IN-SapnaNeural` | `test_kannada_voice_unclear_end_to_end_localization` |
| Hindi voice | Hindi script | Hindi | `hi-IN-SwaraNeural` | `test_farmer_domain_guardrail` (hi) |
| English voice | English | English (no translate pass) | `en-IN-NeerjaNeural` | `test_english_voice_keeps_english_reply` |
| Kannada typed | Kannada text | Kannada via `localize_blocks` | Kannada if auto-play | `test_localize_blocks_translates_disease_symptoms` |
| Hindi typed | Hindi text | Hindi | Hindi if auto-play | `test_guardrail_localized_for_hindi` |
| English typed | English | English | English | `test_english_voice_keeps_english_reply` |

**Run tests:**

```bash
cd backend
py -m pytest features/chat/tests/test_multilingual_conversation.py -v
```

**Sample pytest output (2026-05-30):**

```
42 passed in 2.54s  # multilingual + final_ai_quality + sarvam_stt batch
```

---

## Failure Handling (localized)

Low STT confidence or Whisper/mock fallback → **no diagnosis**.

| Language | Farmer message |
|----------|----------------|
| English | I could not clearly understand the audio. Please try again. |
| Kannada | ನಾನು ಆಡಿಯೋವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. |
| Hindi | मैं ऑडियो को स्पष्ट रूप से समझ नहीं पाया। कृपया पुनः प्रयास करें। |

Source: `backend/features/chat/utils/farmer_messages.py` → applied in `localize_blocks()`.

---

## Frontend conversation.language

- Stored per conversation in Zustand + localStorage (`conversationStore.ts`).
- Updated after each successful chat turn via `persistConversationLanguage()`.
- Restored when switching chats or rehydrating from storage.
- Voice STT uses `resolveConversationLanguage(userSelected, detected)`.

---

## Known Limitations

1. **Translation provider dependency** — Disease names, follow-up questions, and first-aid steps use `localize_blocks()` → Groq/LibreTranslate/mock. With `TRANSLATION_PROVIDER=mock`, replies get demo prefixes (e.g. `[ಕನ್ನಡ]`). Use Groq for production-quality Kannada/Hindi prose.

2. **Groq daily quota** — If `USE_GROQ_EXTRACTION=true` or Groq translation hits 429, extraction falls back to rules; translation falls back to mock.

3. **UI chrome** — Card labels (“Disease Analysis”, “Yes/No” buttons) remain English in the React UI; assistant **content** is localized.

4. **No Sarvam TTS** — Speech output uses Microsoft Edge neural voices only.

5. **Malayalam / Urdu** — Supported in enums and TTS map; Groq translation omits `ml`; Sarvam STT map omits `ur`. Fallback is mock translation + default `TTS_VOICE` from settings.

6. **Backend chat entity** — Language is not persisted on the server chat record; client sends `language` on every message and stores it locally.

---

## Key Files

| Area | Path |
|------|------|
| Language resolution | `backend/features/chat/utils/conversation_language.py` |
| Farmer system copy | `backend/features/chat/utils/farmer_messages.py` |
| Response localization | `backend/features/chat/utils/localization.py` |
| Chat wiring | `backend/features/chat/services/chat_service.py` |
| Sarvam STT | `backend/features/voice/services/sarvam_stt_provider.py` |
| Edge TTS voices | `backend/features/voice/services/tts_service.py` |
| Frontend language | `frontend/src/lib/voice-language.ts`, `frontend/src/stores/conversationStore.ts` |
| Tests | `backend/features/chat/tests/test_multilingual_conversation.py` |

---

## Manual Demo Checklist

1. Set language to **Kannada** in header dropdown.
2. Open mic → speak a symptom → confirm Network: `language=kn` on transcribe + chat.
3. Confirm assistant reply in Kannada script (or `[ಕನ್ನಡ]` prefix if mock translation).
4. Enable auto-play → confirm `X-TTS-Voice: kn-IN-SapnaNeural` on `/voice/speak`.
5. Repeat for **Hindi** and **English**.
6. Type symptoms in each language with matching dropdown selection.
