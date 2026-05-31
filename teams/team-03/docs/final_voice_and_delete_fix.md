# Final Voice & Delete Fix

Date: 2026-05-30

## Summary

Fixed two demo blockers: voice chat stuck in infinite loading, and missing/non-functional delete in the sidebar.

---

## Issue 1: Voice chat stuck loading

### Root cause

Multiple compounding bugs:

| # | Problem | Effect |
|---|---------|--------|
| 1 | **`useVoiceMode` never cleared `processing` state** when transcription finished without error | Spinner ran forever after STT returned |
| 2 | **Empty transcript treated as success** | No error shown; `onTranscription` never called; state stuck |
| 3 | **`ChatInput` closed voice panel before async send completed** | User saw chat loading with no feedback if send hung |
| 4 | **No guaranteed `finally` on voice processing** | `isProcessingRecording` could remain true on edge failures |
| 5 | **STT/API failures** sometimes returned without user-facing message | Generic spinner instead of retry prompt |

The primary demo failure was **#1 + #2**: after stop recording, UI entered `processing` and never returned to `idle` or `error`.

### Fix

- **`useVoiceMode`**: Reset `processing → idle` when `isProcessing` becomes false; dedicated error path via `onTranscriptionError`
- **`useVoiceTranscription`**: Empty text → `"I could not understand the audio. Please try again."`; 45s timeout; structured logs
- **`useVoiceInput`**: `try/finally` always clears processing; stable transcribe ref; awaits async `onTranscription`
- **`ChatInput`**: Awaits `onVoiceSend` before closing voice panel
- **`voiceService` / backend `voice/routes.py`**: Request/response logging

### Pipeline logs (browser console)

```
[voice:recording-started]
[voice:recording-stop-requested]
[voice:recording-stopped] { bytes, durationSec, mimeType }
[voice:upload-sent] { bytes, language }
[voice:api-request] { path, bytes, language }
[voice:api-response] { textLength, provider }
[voice:transcription-completed] { textLength, confidence }
[voice:chat-submit-start]
[voice:diagnosis-request]
[voice:diagnosis-complete]
[voice:tts-request]  (if auto-voice enabled)
```

### Backend logs

```
voice/transcribe received filename=... bytes=... language=...
voice/transcribe completed provider=... lang=... text_len=...
```

### STT failure UX

User sees: **"I could not understand the audio. Please try again."** with Retry button — never infinite spinner.

---

## Issue 2: Delete chat button

### Root cause

| # | Problem | Effect |
|---|---------|--------|
| 1 | **Trash icon hidden** behind opacity/hover-only styling | Users reported no delete control |
| 2 | **Persist merge restored mock chats** when saved list was empty | Deleted chats reappeared after refresh |
| 3 | **Initial store seeded with mock conversations** | Cluttered sidebar; delete persistence confusing |

### Fix

- **`ConversationItem`**: Always-visible **Rename** + **Trash** icons on every row (no hover-only)
- **Confirmation dialog** before delete
- **`ConversationSidebar`**: Calls `DELETE /api/v1/chat/{id}` for synced chats; always removes from Zustand + localStorage
- **`deleteChat`**: Ignores 404 (already deleted on server)
- **`conversationStore`**: Starts with empty chat list; persist merge respects empty arrays (no mock restore)

### Delete flow

```
Click trash → Confirm → DELETE /api/v1/chat/{id} → remove from store → localStorage updated
Refresh page → chat stays deleted
```

---

## Files changed

### Frontend
| File | Change |
|------|--------|
| `lib/voice-pipeline-log.ts` | New — logging + unclear-audio message |
| `hooks/use-voice-transcription.ts` | Empty/error handling, timeout, logs |
| `hooks/use-voice-input.ts` | finally block, stable refs, error callback |
| `hooks/use-voice-mode.ts` | State machine fix, async send, error display |
| `hooks/use-chat-orchestration.ts` | Voice send logging, empty guard |
| `components/voice/VoiceMode.tsx` | Error message, processing sync |
| `components/chat/input/ChatInput.tsx` | Await voice send |
| `services/voiceService.ts` | API logging, retry default |
| `services/chatService.ts` | deleteChat 404 tolerance |
| `components/chat/sidebar/ConversationItem.tsx` | Always-visible trash + rename |
| `components/chat/sidebar/ConversationSidebar.tsx` | Robust delete handler |
| `stores/conversationStore.ts` | Empty initial state, persist merge fix |

### Backend
| File | Change |
|------|--------|
| `features/voice/routes.py` | Transcribe request/complete logging |

---

## Verification steps

### Voice
1. Open chat → tap mic → speak symptoms → stop
2. Console shows `[voice:recording-started]` through `[voice:transcription-completed]`
3. Transcript appears OR error message (never infinite spinner)
4. Assistant reply appears in chat
5. If auto-voice on: TTS plays

### Delete
1. Click **New chat** → send a message
2. Click **trash icon** (always visible beside chat title)
3. Confirm delete → chat removed from sidebar
4. Refresh browser → chat still gone

---

## Test results

| Suite | Result |
|-------|--------|
| `npm test` (frontend) | Pass |
| `py -m pytest features/chat/tests/` | Pass (existing suite) |

---

## Screenshots

Capture locally after starting backend + frontend:

1. Sidebar with visible trash icons on each chat row
2. Delete confirmation dialog
3. Voice mode showing transcript after successful STT
4. Voice mode showing error message (not spinner) after failed/empty STT
5. Browser console with `[voice:*]` log sequence
