# Hackathon Demo Readiness — Voice, Translation & UX Integration

## Modified files

### Backend
| File | Change |
|------|--------|
| `features/translation/services/libretranslate_provider.py` | **NEW** — LibreTranslate HTTP client + mock fallback |
| `features/translation/services/translation_service.py` | Provider factory (`auto` / `libretranslate` / `mock`) |
| `features/voice/services/stt_service.py` | **Real** `FasterWhisperSTTProvider` |
| `features/voice/services/mock_stt.py` | **NEW** — extracted mock STT |
| `features/voice/services/tts_service.py` | **Real** `EdgeTTSProvider` with language voice map |
| `features/voice/services/mock_tts.py` | **NEW** — extracted mock TTS |
| `features/voice/services/voice_service.py` | Factory wiring for STT/TTS providers |
| `config/settings.py` | `VOICE_STT_PROVIDER`, `VOICE_TTS_PROVIDER`, `TRANSLATION_PROVIDER`, LibreTranslate URL/key |
| `requirements.txt` | `faster-whisper`, `edge-tts` |
| `.env.example` | New env vars |
| `tests/conftest.py` | Force mock providers in tests |
| `tests/features/test_voice.py` | Accept `audio/mpeg` from Edge TTS |

### Frontend
| File | Change |
|------|--------|
| `hooks/use-auto-voice-reply.ts` | **NEW** — auto TTS playback after assistant reply |
| `hooks/use-chat-orchestration.ts` | Auto voice reply + voice send pipeline |
| `stores/conversationStore.ts` | `autoPlayResponses` setting (persisted) |
| `types/conversation.ts` | Store types for auto-play |
| `components/chat/layout/ChatHeader.tsx` | Language dropdown (mobile) + Auto voice toggle |
| `components/chat/cards/*.tsx` | Polished cards, mobile-friendly layout |
| `lib/conversation-utils.ts` | `getAssistantSpeakableSummary()` |

*(Translation frontend service was already on real API — unchanged interface.)*

---

## New providers

| Provider | Module | Fallback |
|----------|--------|----------|
| **LibreTranslate** | `libretranslate_provider.py` | MockTranslationProvider |
| **Faster Whisper STT** | `stt_service.py` | MockSpeechToTextProvider |
| **Edge TTS** | `tts_service.py` | MockTextToSpeechProvider (WAV) |

### Edge TTS voices (en, kn, hi, ta, te)
- `en` → `en-IN-NeerjaNeural`
- `hi` → `hi-IN-SwaraNeural`
- `kn` → `kn-IN-SapnaNeural`
- `ta` → `ta-IN-PallaviNeural`
- `te` → `te-IN-ShrutiNeural`

---

## Environment variables

### Backend (`backend/.env`)
```env
# Voice
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
VOICE_STT_PROVIDER=auto          # auto | faster-whisper | mock
VOICE_TTS_PROVIDER=auto          # auto | edge-tts | mock
TTS_ENGINE=edge-tts
TTS_VOICE=hi-IN-SwaraNeural

# Translation
TRANSLATION_PROVIDER=auto        # auto | libretranslate | mock
LIBRETRANSLATE_URL=https://libretranslate.com
LIBRETRANSLATE_API_KEY=          # optional for public instance
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Install new backend deps
```bash
cd backend
pip install -r requirements.txt
```

---

## Manual test scenarios

### 1. Kannada full voice loop
1. Start backend + frontend.
2. Open `/chat` → header language → **Kannada (kn)**.
3. Enable **Auto voice** in header.
4. Tap mic → speak symptoms (English or Kannada) → stop.
5. **Expect:** auto-send → disease/first-aid cards → Kannada localized text → TTS plays.

### 2. Hindi text + translation menu
1. Set language **Hindi**.
2. Send: `My cow has fever and drooling`.
3. Open **Translate** on a message → pick another language.
4. **Expect:** `POST /translation/translate` in network tab.

### 3. Tamil / Telugu TTS
1. Set language **Tamil** or **Telugu**.
2. Tap **Listen** on an assistant message.
3. **Expect:** `POST /voice/speak` returns `audio/mpeg`.

### 4. Diagnostic voice follow-up
1. Send vague symptom → diagnostic question card.
2. Tap **Yes** or **No** (no manual send).
3. **Expect:** follow-up message auto-sent.

### 5. Offline / fallback
1. Set `VOICE_STT_PROVIDER=mock` and restart backend.
2. Transcribe still returns demo text; chat flow continues.

---

## Remaining blockers

| Blocker | Impact | Workaround |
|---------|--------|------------|
| **First Faster Whisper run** downloads model (~150MB+ for `base`) | Slow cold start | Use `WHISPER_MODEL=tiny` for demo |
| **LibreTranslate public API** rate limits / kn support varies | Translation may fallback to mock | Self-host LibreTranslate or add API key |
| **Edge TTS requires internet** | TTS fails offline | Falls back to mock WAV |
| **CPU transcribe latency** | Long pauses on weak laptops | Use `tiny` model or mock STT for stage demo |
| **No GPU** | Whisper slower | Acceptable for short clips |

---

## Verification commands

```bash
cd backend && python -m pytest tests/features/ -q
cd frontend && npm run build
```

Diagnosis logic, confidence scoring, and RAG retrieval were **not modified** in this pass.
