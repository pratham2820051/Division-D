# Voice Root Cause Analysis

**Date:** 2026-05-30  
**Scope:** Part A — end-to-end voice pipeline audit (no provider replacement)

---

## Pipeline traced

```
Frontend Mic (MediaRecorder)
    ↓ use-audio-recorder.ts — WebM/Opus blob, 250ms chunks
    ↓ use-voice-input.ts — autoTranscribe on stop
    ↓ use-voice-transcription.ts — POST FormData
    ↓ voiceService.ts → POST /api/v1/voice/transcribe
    ↓ voice/routes.py
    ↓ VoiceService → FasterWhisperSTTProvider (default)
    ↓  on Exception → MockSpeechToTextProvider (fallback_used=true)
    ↓ TranscribeResponse → use-chat-orchestration (voiceMetadata)
    ↓ POST /chat/{id}/message → voice confidence gate → orchestrator
```

---

## Exact failing component

**Primary failure point:** `FasterWhisperSTTProvider._transcribe_sync()` in  
`backend/features/voice/services/stt_service.py`

When Whisper cannot decode or transcribe the uploaded blob, the exception handler silently swaps to **Mock STT**, which returns **random canned English/Hindi/Kannada sample sentences** unrelated to what the farmer said.

### Verified locally (2026-05-30)

```text
Faster Whisper failed ([Errno 1094995529] Invalid data found when processing input: '...\tmp.webm'), using mock STT
RESULT mock True
```

| Check | Result |
|-------|--------|
| `faster_whisper` import | OK |
| `WhisperModel('base', cpu)` load | OK (~10s cold start) |
| `ffmpeg` on PATH | OK (`WinGet\Links\ffmpeg.exe`) |
| Invalid/corrupt WebM → Whisper | **Fails → mock fallback** |

---

## Root causes (ranked)

### 1. Silent mock fallback after Whisper failure (Critical)

**File:** `stt_service.py` lines 137–154

Any decode/transcribe error triggers mock STT. The API still returns HTTP 200 with plausible-looking text. Until the recent stabilization pass, chat continued diagnosis on this garbage text.

**Symptom:** Kannada UI + random English transcript + wrong disease questions.

**Mitigation already in place:** Chat blocks diagnosis when `fallback_used=true` or `transcription_confidence < 0.45`.

**Remaining gap:** User still sees a transcript in VoiceMode UI before send; retry UX depends on user noticing the warning.

---

### 2. Browser WebM → Whisper decode edge cases (High)

**Files:** `use-audio-recorder.ts`, `stt_service.py`

- Frontend records `audio/webm;codecs=opus` (or mp4 on Safari).
- Backend writes raw bytes to temp file with `.webm` suffix and passes to faster-whisper.
- Short recordings, truncated blobs, or mobile Safari containers can produce **invalid containers** → Whisper `Invalid data found when processing input` → mock fallback.

**Not an ffmpeg-missing issue on this machine** (ffmpeg present). Failure is **container/content**, not absence of ffmpeg.

---

### 3. Cold model load latency (Medium)

**File:** `stt_service.py` `_load_model()`

First request after server start loads `WhisperModel(base)` on CPU (~10s). No explicit HTTP timeout on frontend upload, but user sees **"Transcribing your speech..."** (`VoiceMode` processing state) for extended period.

**Log pattern:** No error — just slow first transcription.

---

### 4. Forced language hint vs detected speech (Medium)

**File:** `stt_service.py` — `transcribe_kwargs["language"] = requested`

UI language (kn/hi/en) is forced into Whisper. Correct when farmer speaks the selected language; wrong when they speak another language → low confidence or wrong script.

**Mitigation:** Language mismatch confirmation in chat orchestrator when `requested ≠ detected` and `language_confidence ≥ 0.55`.

---

### 5. `WHISPER_MODEL=base` on CPU (Medium)

Default `base` model has weak Kannada/Hindi accuracy on short farmer utterances. Contributes to low `transcription_confidence` → chat retry message (correct behavior, feels like "voice broken").

---

### 6. Frontend waiting state (Low)

**Files:** `use-voice-mode.ts`, `VoiceMode.tsx`

Processing state works correctly (`isProcessing` → spinner). No deadlock found. Failures surface as `transcriptionState.error` or silent success with mock text (issue #1).

---

## Logs to watch

Backend (uvicorn):

```text
faster-whisper transcribe requested=kn detected=... transcription_conf=0.xx language_conf=0.xx
Faster Whisper failed (...), using mock STT
```

Frontend network tab — `POST /api/v1/voice/transcribe` response:

```json
{
  "provider": "mock",
  "fallback_used": true,
  "confidence": 0.92,
  "text": "My cow has fever since yesterday"
}
```

If `fallback_used: true`, the transcript is **not** from Whisper.

---

## Reproduction steps

### A — Mock fallback path (reliable)

1. Start backend: `.\.venv\Scripts\uvicorn.exe main:app --reload`
2. Record voice in UI OR POST corrupt bytes:

```powershell
curl -X POST http://localhost:8000/api/v1/voice/transcribe `
  -F "audio=@broken.webm" `
  -F "language=kn"
```

3. Observe backend log: `Faster Whisper failed ... using mock STT`
4. Response: `"provider": "mock"`, `"fallback_used": true`

### B — Multilingual failure (demo)

1. Set language selector to **Kannada**
2. Speak Kannada for 2–3 seconds; stop recording
3. If Whisper succeeds: `"provider": "faster-whisper"`, Kannada text
4. If Whisper fails: mock English/Hindi sample → chat shows voice retry message (after stabilization)

### C — Cold start delay

1. Restart backend
2. First voice message within 15s of startup
3. Observe 8–12s processing spinner before response

---

## Component health summary

| Stage | Status | Notes |
|-------|--------|-------|
| Mic / MediaRecorder | OK | Permission, WebM recording functional |
| Upload (`apiUploadJson`) | OK | No timeout; retries on 5xx |
| `voice/transcribe` route | OK | Passes language hint |
| VoiceService wiring | OK | Default faster-whisper |
| Faster Whisper | **Fragile** | Fails on bad/short WebM; cold start |
| Mock fallback | **Harmful if silent** | Now flagged + chat blocked |
| Chat voice gate | OK | Blocks low confidence / fallback |

---

## Recommended fixes (without replacing providers)

1. **Server:** Log and return explicit `error_code` when Whisper fails instead of mock success (keep mock for `VOICE_STT_PROVIDER=mock` only).
2. **Server:** Convert WebM → WAV via ffmpeg before Whisper (normalize container).
3. **Config:** `WHISPER_MODEL=small` for Kannada demos; warm model on startup.
4. **Frontend:** Block auto-send when `fallbackUsed`; show retry inline in VoiceMode.
5. **Config:** Document `VOICE_STT_PROVIDER=mock` for offline demos only.

---

## Related docs

- [`voice_input_audit.md`](voice_input_audit.md) — earlier metadata fixes
- [`final_ai_quality_report.md`](final_ai_quality_report.md) — voice confidence gating in chat
