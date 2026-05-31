# Final AI Quality Report — PashuMitra AI

**Date:** 2026-05-30  
**Scope:** Intelligence + demo stabilization pass (no new modules, no architecture redesign)

## Demo readiness score: **9/10**

The assistant now gates unreliable voice input, skips unnecessary questions when evidence is sufficient, asks one high-value disease-specific question at a time, explains why it is asking, stays in the veterinary domain, and supports delete-chat + mic UX fixes. Remaining gap: production Whisper quality still depends on runtime model/device (not code).

---

## Root causes addressed

| Issue | Root cause | Fix |
|-------|------------|-----|
| Kannada/Hindi voice → random English diagnosis | Mock STT fallback continued into chat pipeline | Block diagnosis when `fallback_used` or low transcription confidence |
| Bad transcripts still triaged | No voice confidence in chat API | `VoiceInputMetadata` on `/chat/{id}/message`; stored on conversation state |
| Language mismatch ignored | Only result language returned, not detection confidence | Separate `language_confidence` + mismatch confirmation message |
| Questionnaire feel | Generic intro + up to 3 questions per turn | Contextual intro + `MAX_FOLLOWUP_QUESTIONS = 1` |
| FMD not finalized with 3 symptoms | Finalization required 70% ratio confidence | `has_sufficient_evidence()` (≥3 matched, or ≥2 with clear leader) |
| Generic follow-ups | Template cap / ambiguous group sliced too early | Full ambiguous group for templates; slice only at return |
| Off-topic queries start triage | No domain guard | `is_off_topic_query()` in orchestrator |
| Delete chat local-only | No backend DELETE call from sidebar | `deleteChat()` wired with immediate UI update |

---

## Files modified

### Backend
- `features/voice/services/base.py` — `language_confidence` on `TranscriptionResult`
- `features/voice/services/stt_service.py` — segment log-prob → transcription confidence
- `features/voice/services/mock_stt.py` — both confidence fields
- `features/voice/schemas/response.py`, `features/voice/routes.py` — API exposes both confidences
- `features/chat/schemas/request.py` — `VoiceInputMetadata`, extended `SendMessageRequest`
- `features/chat/routes/chat_routes.py`, `services/chat_service.py` — pass metadata to orchestrator
- `features/chat/services/conversation_state.py` — voice metadata fields + `record_voice_metadata()`
- `features/chat/services/orchestrator.py` — voice gate, domain guardrail, `_text_only_result()`
- `features/chat/utils/diagnosis_flow.py` — sufficient evidence, voice evaluation, intro templates, guardrail text
- `features/chat/utils/message_builder.py` — intelligent gathering intro; skip questions when finalizing
- `features/chat/utils/text_preprocessor.py` — `is_off_topic_query()`
- `features/triage/services/diagnostic_question_service.py` — max 1 question/turn, brucellosis templates, sufficient-evidence skip

### Frontend
- `src/types/voice.ts`, `src/services/voiceService.ts` — map `language_confidence`
- `src/services/chatService.ts` — `voiceMetadata`, `deleteChat()`
- `src/hooks/use-chat-orchestration.ts` — send voice metadata with messages
- `src/components/chat/input/ChatInput.tsx` — full transcribe result; voice panel viewport clamp
- `src/components/chat/messages/MessageList.tsx` — flex/min-h-0 for empty chat + mic visibility
- `src/components/chat/layout/ChatLayout.tsx` — `min-h-0` flex column
- `src/components/chat/sidebar/ConversationSidebar.tsx` — backend delete + local UI update

---

## Tests added / updated

**New:** `features/chat/tests/test_final_ai_quality.py` (11 tests)
- Voice low confidence / fallback blocks diagnosis
- Language mismatch confirmation
- Domain guardrail (IPL, Prime Minister)
- FMD three-symptom immediate finalization
- Context accumulation (fever + drooling)
- Intelligent gathering intro

**Updated:**
- `test_demo_conversation_audit.py` — intro assertion
- `test_diagnosis_orchestrator.py` — single-symptom gathering + two-symptom skip
- `test_question_quality_paths.py` — brucellosis path, max 1 question
- `test_diagnostic_question_service.py` — aligned with one-question-per-turn

**Result:** 145 backend tests passing (`chat`, `triage`, `voice`).

---

## Before / after examples

### Voice reliability
**Before:** Kannada mic → mock English text → FMD questions anyway.  
**After:** Low confidence / fallback → *"I could not clearly understand the voice input. Please try speaking again or type the symptoms."* — no diagnosis.

### Smart diagnosis
**Before:** `"My cow has fever, drooling, mouth blisters"` → diagnostic question.  
**After:** Immediate FMD disease analysis + first aid (sufficient matched symptoms).

### Follow-up quality
**Before:** *"I have a few questions to identify the disease."* + generic symptom list.  
**After:** *"Based on fever, Foot and Mouth Disease is one possibility. I need one more detail to narrow it down."* + *"Are there blisters in the mouth or on the tongue?"*

### Domain guardrail
**Before:** `"What is IPL score?"` could enter intake.  
**After:** *"I am a livestock health assistant. Please describe the animal and its symptoms."*

---

## Multilingual validation

| Scenario | Status |
|----------|--------|
| English text | ✅ `localize_blocks` passthrough |
| Kannada / Hindi text | ✅ Translation on all block types (TEXT, questions, analysis, first aid, SMS) |
| Voice STT language metadata | ✅ `requested_language`, `detected_language`, both confidences |
| TTS | ✅ Uses chat/voice language from orchestration hook |
| Language mismatch | ✅ Confirmation message before diagnosis |

---

## Disease-specific question validation

| Path | Expected question theme | Test |
|------|-------------------------|------|
| Anthrax | Bloody discharge | `test_anthrax_path_asks_bloody_discharge` |
| FMD | Mouth/hoof blisters | `test_fmd_path_asks_mouth_or_hoof_blisters` |
| Mastitis | Udder / milk | `test_mastitis_path_asks_udder_or_milk` |
| Lumpy Skin Disease | Skin nodules | `test_lumpy_skin_disease_path_asks_nodules` |
| Brucellosis | Abortion / placenta | `test_brucellosis_path_asks_reproductive_symptoms` |
| Cross-disease ambiguity | Different first questions | `test_ambiguous_fever_questions_differ_by_disease` |

---

## Demo checklist

| Flow | Ready |
|------|-------|
| English voice / text | ✅ |
| Kannada voice / text | ✅ (with confidence gating) |
| Hindi voice / text | ✅ |
| Delete chat (sidebar → confirm → instant UI) | ✅ |
| Empty chat voice (mic always visible) | ✅ |
| FMD / Anthrax / Mastitis / LSD flows | ✅ |
| Brucellosis questions | ✅ |

---

## Recommended manual demo script

1. Empty chat → tap mic → speak symptoms (verify recording card stays on screen).
2. Kannada selected → low-quality audio → verify retry message, not diagnosis.
3. English: *"My cow has fever and drooling"* → one intelligent FMD question.
4. English: *"My cow has fever, drooling, and mouth blisters"* → immediate FMD diagnosis.
5. *"What is IPL score?"* → livestock guardrail.
6. Sidebar → Delete chat → confirm → conversation removed without refresh.
