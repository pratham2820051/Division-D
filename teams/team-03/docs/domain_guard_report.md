# Domain Guard Report

**Date:** 2026-05-30  
**Scope:** Parts C & D — domain classification + conversation state leak fixes

---

## Problem statement

**Observed bug:**

```
User (prior turn): "My cow has fever"
Assistant: [diagnostic question about FMD]
User: "When is IPL final?"
Assistant: [continues diagnosis]  ← WRONG
```

**Root cause:** `is_off_topic_query()` returned `False` whenever `has_active_context=True` (accumulated symptoms, animal type, or pending question). Off-topic checks were **disabled mid-diagnosis**.

---

## Fix: domain classification before diagnosis

### New module

`backend/features/chat/utils/domain_classifier.py`

```python
class MessageDomain(str, Enum):
    LIVESTOCK_HEALTH = "livestock_health"
    OUT_OF_SCOPE = "out_of_scope"
```

### Classification rules (current message only)

| Message | Domain |
|---------|--------|
| `"My cow has fever"` | LIVESTOCK_HEALTH (livestock hints) |
| `"When is IPL final?"` | OUT_OF_SCOPE (`\bipl\b`, general question) |
| `"What is Java?"` | OUT_OF_SCOPE (pattern + `?`) |
| `"drooling"` | LIVESTOCK_HEALTH (symptom fragment) |
| `"Who is Prime Minister?"` | OUT_OF_SCOPE |

**Critical change:** Classification does **not** consult prior diagnosis state.

### Orchestrator flow (`orchestrator.py`)

```
1. Voice confidence gate (if voice_metadata)
2. Yes/No handler (if answering diagnostic question)
3. classify_message_domain(current_message)   ← NEW ORDER
4. If OUT_OF_SCOPE → guardrail text, STOP
5. Absorb symptoms from current message
6. Run diagnosis pipeline
```

Guardrail text:

> I am a livestock health assistant. Please describe the animal and its symptoms.

---

## Part D: conversation state leaks

### Leak type 1 — Same-turn diagnosis continuation

**Before:** IPL message absorbed after symptom state built → diagnosis ran with historical symptoms.

**After:** Domain check runs **before** `_apply_current_user_turn` and **before** `_run_diagnosis`. OUT_OF_SCOPE never enters diagnosis.

### Leak type 2 — Cross-turn symptom carryover after off-topic

**Before:** Messages rebuilt from full history always included pre-IPL fever.

**After:** `ConversationState.from_messages()` **resets accumulated state** when it encounters a guardrail assistant message:

```python
if is_guardrail_response(message.content):
    state = cls(language=language)  # fresh state
    pending_symptom = None
    pending_question = None
    continue
```

Also resets after voice-clarity messages (`VOICE_UNCLEAR_TEXT`, language mismatch).

**Effect:**

```
Turn 1: "My cow has fever"     → gathering (fever in state)
Turn 2: "When is IPL final?"   → guardrail (no diagnosis)
Turn 3: "My goat has lameness" → fresh state (goat/lameness only, no fever)
```

**Preserved behavior:**

```
Turn 1: "My cow has fever"
Turn 2: "drooling"             → still LIVESTOCK_HEALTH, fever + drooling combined
```

---

## Files modified

| File | Change |
|------|--------|
| `features/chat/utils/domain_classifier.py` | **New** — `MessageDomain`, `classify_message_domain()`, `is_guardrail_response()` |
| `features/chat/services/orchestrator.py` | Domain check before absorb/diagnose; removed `has_active_context` bypass |
| `features/chat/services/conversation_state.py` | Reset state after guardrail assistant messages |
| `features/chat/utils/text_preprocessor.py` | `is_off_topic_query()` deprecated wrapper |
| `features/chat/utils/diagnosis_flow.py` | `DOMAIN_GUARDRAIL_TEXT` imported from classifier (single source) |

---

## Tests added

**File:** `features/chat/tests/test_domain_guard.py`

| Test | Validates |
|------|-----------|
| `test_classify_message_domain` (parametrize) | LIVESTOCK vs OUT_OF_SCOPE examples |
| `test_ipl_after_fever_does_not_continue_diagnosis` | **Core bug fix** — no diagnostic/disease cards after IPL |
| `test_guardrail_resets_conversation_state` | Fever cleared after guardrail in history |
| `test_out_of_scope_after_guardrail_starts_fresh_goat_case` | New livestock topic after IPL |
| `test_livestock_followup_after_fever_still_works` | `"drooling"` still continues triage |
| `test_is_guardrail_response` | Guardrail detection helper |

**Updated:** `test_final_ai_quality.py` — uses `classify_message_domain` instead of deprecated helper.

**Result:** 155 tests passing across chat/triage/voice (including 8 new domain guard tests).

---

## Before / after

### Before

```
User: My cow has fever
AI:   Based on fever, FMD is one possibility… Are there blisters?
User: When is IPL final?
AI:   Based on fever, FMD is one possibility… [continues questionnaire]
```

### After

```
User: My cow has fever
AI:   Based on fever, FMD is one possibility… Are there blisters?
User: When is IPL final?
AI:   I am a livestock health assistant. Please describe the animal and its symptoms.
User: My goat has lameness
AI:   [intake/triage for goat — no fever carryover]
```

---

## Limitations & future work

| Gap | Notes |
|-----|-------|
| Rule-based classifier | IPL/Java/cricket patterns are explicit; unknown off-topic may slip through as intake |
| No LLM intent classifier | Acceptable for demo; consider Sarvam/Groq intent for production |
| Guardrail does not delete DB messages | History still stored; only **in-memory state** resets at guardrail boundary |
| Voice off-topic transcript | If Whisper returns IPL text from noise, domain guard catches it on text |

---

## Manual verification checklist

1. Start diagnosis with cow fever → confirm question appears.
2. Ask `"When is IPL final?"` → guardrail only, no disease cards.
3. Ask `"My goat has lameness"` → goat intake, no fever merge.
4. Fresh chat: `"What is Java?"` → guardrail.
5. Fresh chat: `"My cow has fever"` → normal triage.
