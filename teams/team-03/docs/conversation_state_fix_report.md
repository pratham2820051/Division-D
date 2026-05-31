# PashuMitra AI — Conversation State Fix Report

Generated: 2026-05-30

## Root causes found

### 1. No conversation memory model
The orchestrator re-extracted each turn in isolation. A follow-up reply like `"Cow"` did not reliably merge prior symptoms, and generic intake (`"What type of animal is affected?"`) could fire even when `"cow"` had already been mentioned.

### 2. Broken yes/no follow-up flow
Answering `"No"` restarted with a generic prompt instead of re-running diagnosis. Answering `"Yes"` merged symptoms incompletely and did not maintain confirmed vs rejected evidence.

### 3. Symptom label mismatch
Farmer phrases and rule labels (e.g. `drooling`, `fever`) did not match disease KB wording (`excessive salivation and drooling`, `high fever`), reducing match confidence.

### 4. Repeated questions
There was no tracking of asked questions or confirmed symptoms, so the same diagnostic question could be sent again.

### 5. Language stale in auto TTS
Auto voice reply captured `language` from a React closure; changing the header language did not always update the TTS language for the next response.

---

## Files modified

| File | Change |
|------|--------|
| `backend/features/chat/services/conversation_state.py` | **NEW** — `ConversationState` manager |
| `backend/features/chat/services/orchestrator.py` | State-driven memory, yes/no re-diagnosis |
| `backend/features/chat/utils/message_builder.py` | Contextual intake; skip repeated questions |
| `backend/features/chat/services/diagnosis_orchestrator.py` | Pass state to diagnostic service |
| `backend/features/triage/services/diagnostic_question_service.py` | Filter asked/confirmed/rejected symptoms |
| `backend/features/confidence_scoring/utils/symptom_normalizer.py` | Symptom equivalence groups |
| `backend/features/confidence_scoring/services/confidence_service.py` | Overlap via equivalence |
| `backend/features/chat/utils/farmer_language_dictionary.py` | Added weakness / drooling mappings |
| `backend/features/chat/services/symptom_extraction_service.py` | `detect_animal_only_message()` |
| `backend/features/chat/tests/test_conversation_state.py` | **NEW** — memory & follow-up tests |
| `frontend/src/hooks/use-chat-orchestration.ts` | Fresh language from store for auto TTS |

---

## Before / after behavior

| Scenario | Before | After |
|----------|--------|-------|
| `"My cow has fever"` → `"Cow"` | Re-asked animal type | Remembers cattle + fever; asks symptoms or disease-specific follow-ups only |
| Fever → mouth ulcer question → `"Yes"` | Unrelated restart | Confirms symptom, re-runs diagnosis, boosts FMD confidence |
| `"mouth water coming"` | Often missed | Maps to `excessive salivation and drooling` |
| `"not eating"` | Sometimes missed | Maps to `reduced appetite` |
| `"animal weak"` | Missed | Maps to `weakness and lethargy` |
| Language → Kannada + auto voice | TTS could stay English | TTS reads current store language (`kn` voice) |
| Same diagnostic question twice | Possible | Blocked via `asked_questions` / `asked_symptoms` |

---

## ConversationState fields

```python
ConversationState(
    animal_type,
    extracted_symptoms,
    confirmed_symptoms,
    rejected_symptoms,
    asked_questions,
    asked_symptoms,
    active_question,
    active_symptom,
    language,
    top_candidate_diseases,
    disease_mention,
)
```

Rebuilt from chat history on each turn; yes/no answers update confirmed/rejected sets before re-diagnosis.

---

## Test results

```bash
cd backend
pytest features/chat/tests/test_conversation_state.py \
       features/chat/tests/test_intelligence_upgrade.py \
       features/chat/tests/test_symptom_extraction.py \
       features/chat/tests/test_diagnosis_orchestrator.py \
       features/chat/tests/test_chat_orchestrator_integration.py \
       features/triage/tests/test_diagnostic_question_service.py -q
```

**59 passed** (conversation pipeline suite).

---

## Remaining limitations

- State is derived from in-memory chat messages; server restart clears history unless persisted via existing memory service.
- Groq symptom extraction (`USE_GROQ_EXTRACTION=true`) may behave differently from rule-based tests.
- Weakness mapping may match colloquial `"dull"` — narrow messages can still trigger weakness.
- Translation quality still depends on `GROQ_API_KEY` / LibreTranslate configuration.
- Frontend per-message **Listen** button uses hook language at render time (updates on re-render when language changes).

---

## Expected demo flow

1. **English:** `"My cow has fever"` → disease analysis + FMD/LSD follow-up (not animal intake).
2. Tap **Yes** on mouth blister question → FMD confidence increases.
3. Switch language to **Kannada** → new messages localized; auto voice uses Kannada TTS.
4. **Farmer language:** `"mouth water coming and not eating"` → drooling + reduced appetite extracted.
