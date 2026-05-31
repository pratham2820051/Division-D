# Repeated Diagnostic Question Fix

## Problem

After answering **YES** or **NO** to a diagnostic question (e.g. bloody discharge), the assistant asked the **same question again**.

Example:

| Turn | Content |
|------|---------|
| AI | Does the animal have bloody discharge from natural openings? |
| User | YES |
| AI | *(same question again)* ❌ |

---

## Root cause analysis

| Check | Finding |
|-------|---------|
| 1. YES/NO received? | ✅ Frontend sends `"Yes"` / `"No"`; backend normalizes to `yes` / `no`. |
| 2. Answer stored? | ⚠️ Partially — `confirm_symptom` / `reject_symptom` ran only when `active_symptom` was set. |
| 3. Symptom in state? | ❌ **Non-English UI:** `localize_blocks()` translated payload `context` (canonical symptom key) into Kannada/Hindi, so tracking keys no longer matched English disease templates. |
| 4. Question marked answered? | ❌ No dedicated `answered_*` sets; `asked_symptoms` alone did not record YES/NO outcome. |
| 5. Same question regenerated? | ✅ Template matcher could not see confirmed/rejected symptom → selected the same template again. |

**Primary bug:** translating machine-readable `context` / symptom keys broke YES/NO → symptom → skip pipeline for Kannada/Hindi chats.

**Secondary bug:** no `record_diagnostic_answer()` — answered questions were not explicitly excluded after YES/NO.

---

## Fixes

### 1. Stable payload keys (`message_builder.py`, `messages.py`)

Diagnostic payloads now include:

```json
{
  "question": "<localized display text>",
  "question_key": "<English question — never translated>",
  "symptom_key": "<English canonical symptom>",
  "context": "<same as symptom_key for backward compat>"
}
```

### 2. Localization (`localization.py`)

- Translates **only** `question` for display.
- Does **not** translate `context`, `symptom_key`, or `question_key`.

### 3. Conversation state (`conversation_state.py`)

New tracking:

- `answered_questions: set[str]`
- `answered_symptoms: set[str]`

New method:

```python
record_diagnostic_answer(question, symptom, confirmed=True|False)
```

- **YES** → `confirm_symptom` + mark answered
- **NO** → `reject_symptom` + mark answered
- Never ask again via `should_skip_question()`

History rebuild uses `question_key` / `symptom_key` from stored payloads.

### 4. Orchestrator (`orchestrator.py`)

- Handles YES/NO when `active_question` **or** `active_symptom` is set.
- Uses `record_diagnostic_answer()` then re-runs diagnosis.

### 5. Diagnostic question service

Skips symptoms in `answered_symptoms` when building the next follow-up.

---

## State before / after (YES to bloody discharge)

### Before (broken — Kannada UI)

```text
asked_symptoms: {"<kannada translated context>"}
confirmed_symptoms: []
answered_symptoms: []
→ next template: "bloody discharge from natural openings" (no match) → repeat
```

### After (fixed)

```text
symptom_key: "bloody discharge from natural openings"
record_diagnostic_answer(..., confirmed=True)
confirmed_symptoms: ["bloody discharge from natural openings"]
answered_symptoms: {"bloody discharge from natural openings", ...}
→ next template: sudden death / swelling (Anthrax Q2)
```

---

## Verification transcript

| Step | User | Expected AI |
|------|------|-------------|
| 1 | My goat has fever | Q1: Bloody discharge? |
| 2 | YES | Q2: Sudden death? (not Q1) |
| 3 | YES | Q3 or final diagnosis |
| 4 | NO on any Q | That symptom excluded; new question |

Automated tests: `backend/features/chat/tests/test_repeated_question_fix.py`

---

## Files changed

- `backend/features/chat/schemas/messages.py`
- `backend/features/chat/utils/localization.py`
- `backend/features/chat/utils/message_builder.py`
- `backend/features/chat/services/conversation_state.py`
- `backend/features/chat/services/orchestrator.py`
- `backend/features/triage/services/diagnostic_question_service.py`
- `backend/features/chat/tests/test_repeated_question_fix.py`
- `backend/features/chat/tests/test_conversation_state.py`
