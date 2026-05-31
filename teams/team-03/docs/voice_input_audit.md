# Voice Input Audit

**Date:** 2026-05-30  
**Scope:** Multilingual voice pipeline (Kannada / English)

---

## Pipeline Verified

```
Frontend MediaRecorder (WebM)
    ↓
use-voice-transcription → resolveVoiceLanguage() → FormData language=
    ↓
POST /api/v1/voice/transcribe
    ↓
VoiceService → FasterWhisperSTTProvider (default)
    ↓  (on failure)
MockSpeechToTextProvider (silent fallback — fixed to expose metadata)
    ↓
TranscriptionResult → chat uses language from STT response
```

---

## Root Cause

**Primary:** Faster Whisper failures fell back to **Mock STT silently**, returning random canned English/Hindi sample sentences while the UI language was Kannada. The frontend only used `result.text` and ignored provider metadata, so users saw English transcripts with Kannada UI — classic “language leakage.”

**Secondary issues:**

| Issue | Impact |
|-------|--------|
| Mock fallback not surfaced | User cannot tell real STT failed |
| `TranscribeResponse` lacked `provider` / `fallback_used` | No client-side diagnostics |
| Chat always used UI selector language, not STT `language` field | Mismatch when fallback text language ≠ selector |
| Whisper `language` hint forced from UI (by design) | Correct when selector matches speech; wrong if farmer speaks other language |
| `WHISPER_MODEL=base` on CPU | Weak Kannada accuracy on short utterances |
| WebM uploads without server-side conversion | Can trigger Whisper errors → mock fallback |

**What was NOT wrong:**

- Language **is** sent from frontend (`FormData language=kn|en`)
- Faster Whisper **is** the default provider (`VOICE_STT_PROVIDER=auto`)
- Whisper **does** receive the language hint when not `auto`

---

## Fixes Applied

### Backend

| File | Change |
|------|--------|
| `features/voice/services/base.py` | Extended `TranscriptionResult` with `provider`, `fallback_used`, `requested_language`, `detected_language` |
| `features/voice/services/stt_service.py` | Return `language` = requested hint when provided; log requested vs detected; set `fallback_used=True` on mock fallback |
| `features/voice/services/mock_stt.py` | Improved Kannada samples; always set provider metadata |
| `features/voice/schemas/response.py` | Expose provider metadata in API |
| `features/voice/routes.py` | Pass through new fields |
| `features/voice/tests/test_stt_language.py` | **New** — Kannada/English language contract tests |

### Frontend

| File | Change |
|------|--------|
| `types/voice.ts` | Extended API/result types |
| `services/voiceService.ts` | Map provider metadata |
| `hooks/use-voice-transcription.ts` | Return full `TranscribeResult`; warn on `fallbackUsed` |
| `hooks/use-voice-input.ts` | Pass full result to callbacks |
| `hooks/use-chat-orchestration.ts` | `sendVoiceMessage(text, voiceLanguage)` uses STT language for chat + TTS |
| `components/chat/input/ChatInput.tsx` | Forward STT language to voice send |

---

## Expected Behavior After Fix

| UI language | Audio | API `language` | API `provider` | Chat language |
|-------------|-------|----------------|------------------|---------------|
| Kannada | Kannada speech | `kn` | `faster-whisper` | `kn` |
| English | English speech | `en` | `faster-whisper` | `en` |
| Kannada | Whisper fails | `kn` | `mock` + `fallback_used: true` | `kn` + UI warning |

---

## Configuration

```env
VOICE_STT_PROVIDER=auto          # faster-whisper with mock fallback
WHISPER_MODEL=base               # consider small for Kannada demos
WHISPER_DEVICE=cpu
```

For offline demos without Whisper installed:

```env
VOICE_STT_PROVIDER=mock
```

---

## Tests

```bash
cd backend
.\.venv\Scripts\python.exe -m pytest features/voice/tests/ tests/features/test_voice.py -q
```

---

## Demo Checklist

1. Set language selector to **Kannada** before recording
2. Check network response includes `"language": "kn"` and `"provider": "faster-whisper"`
3. If `"fallback_used": true`, retry recording — do not trust mock transcript
4. Confirm chat reply and TTS use Kannada
