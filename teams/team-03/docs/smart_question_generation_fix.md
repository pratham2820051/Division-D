# Smart Question Generation & Animal Extraction Fix

## Problem

**User message (Kannada):** `ನನ್ನ ಮೇಕೆಗೆ ಜ್ವರ ಇದೆ` — *My goat has fever*

**Incorrect assistant behavior:** *"Which animal is affected (cow, goat, buffalo) and what symptoms do you see?"*

The animal (**goat**) and symptom (**fever**) were already in the message.

---

## Root cause analysis

| Step | Before fix | Finding |
|------|------------|---------|
| 1. Animal detected? | **No** | `preprocess_farmer_message` only handled **romanized** terms (`meke`, `jwara`), not Kannada script (`ಮೇಕೆಗೆ`, `ಜ್ವರ`). |
| 2. Animal stored? | **No** | `ConversationState._absorb_user_message` only sets `animal_type` when a keyword appears in preprocessed text. |
| 3. Animal lost between turns? | N/A (first turn) | State was empty; nothing to lose. |
| 4. Why animal question? | Intake path | Orchestrator: `not symptoms` → `build_contextual_intake` → `build_generic_intake` when `animal_type` is `None` and symptoms list empty. |

**Symptom extraction** also failed for the same reason (no `fever` in text after lowercase-only normalization).

**Diagnostic follow-ups** were never reached on turn 1 because intake blocked the pipeline.

---

## Fixes applied

### 1. Native script dictionaries (`farmer_language_dictionary.py`)

- **Kannada animals:** ಹಸು/ಹಸುವಿಗೆ/ಹಸುವಿನ → cow; ಮೇಕೆ/ಮೇಕೆಗೆ/ಮೇಕೆಯ → goat; ಎಮ್ಮೆ/… → buffalo; ಕುರಿ/… → sheep  
- **Hindi animals:** गाय/गाय को/… → cow; बकरी/… → goat; भैंस/… → buffalo; भेड़/… → sheep  
- **Symptoms:** ಜ್ವर, ज्वर, बुखार, ताप → fever  
- Expanded **romanized** inflections (`mekege`, `hasuvina`, `bakri ko`, …)

### 2. Preprocessor (`text_preprocessor.py`)

- Applies `NATIVE_SCRIPT_*` mappings **before** romanized word rules (longest phrase first).
- Domain classifier uses preprocessed text for livestock hints.

### 3. Animal detection (`symptom_extraction_service.py`)

- `detect_animal_type_in_text()` — explicit species mention (no default cattle).
- Expanded `ANIMAL_RULES` keywords.
- `ConversationState` uses `detect_animal_type_in_text(preprocessed)` instead of inline keyword loops.

### 4. Contextual intake (`message_builder.py`)

- Never calls `build_generic_intake` when `animal_type` is already set.
- Skips animal question when symptoms exist.

### 5. Fever evidence follow-ups (`diagnostic_question_service.py`)

When fever is reported but disease templates do not produce a question, ask practical evidence questions (duration, appetite, discharge, breathing) — **not** species intake.

---

## Validation: `ನನ್ನ ಮೇಕೆಗೆ ಜ್ವರ ಇದೆ`

| Field | Expected | Actual (after fix) |
|-------|----------|-------------------|
| Preprocessed text | contains `goat`, `fever` | ✓ |
| `animal_type` | `goat` | ✓ |
| Symptoms | `fever` | ✓ |
| Animal intake question | absent | ✓ |
| Follow-up | disease-specific or fever evidence | ✓ (diagnosis path) |

Tests: `backend/features/chat/tests/test_smart_question_generation.py`

---

## Before / after examples

### Example A — Kannada goat + fever

| | Before | After |
|---|--------|-------|
| User | ನನ್ನ ಮೇಕೆಗೆ ಜ್ವರ ಇದೆ | same |
| Extracted animal | *(none → default cattle internally only)* | **goat** |
| Extracted symptoms | *(none)* | **fever** |
| Assistant | Which animal is affected…? | I have a few questions… + disease/fever follow-up (e.g. mouth blisters, duration) |

### Example B — English goat + fever

| | Before | After |
|---|--------|-------|
| User | My goat has fever | same |
| Extracted animal | goat | goat |
| Assistant | Sometimes correct; intake if symptoms missed | No animal question; triage follow-ups only |

### Example C — Hindi cow + fever

| | Before | After |
|---|--------|-------|
| User | मेरी गाय को बुखार है | same |
| Extracted animal | cattle (romanized only) | **cattle** via `गाय` + `बुखार` |
| Assistant | Generic intake if script not romanized | Symptom/disease follow-ups |

---

## Follow-up selection logic (summary)

Questions depend on **known vs unknown evidence**:

**Known:** animal, reported symptoms, disease candidates, confidence, asked/rejected symptoms  

**Unknown:** missing symptoms from top disease profiles or fever triage gaps  

**Never ask:** species when `animal_type` is set; symptoms already in `active_symptoms()`; questions in `asked_questions` / `asked_symptoms`.

**Disease-specific templates** (unchanged, still prioritized): Anthrax, FMD, LSD, Mastitis, Brucellosis — e.g. mouth blisters, udder swelling, skin nodules.

---

## Files changed

- `backend/features/chat/utils/farmer_language_dictionary.py`
- `backend/features/chat/utils/text_preprocessor.py`
- `backend/features/chat/utils/domain_classifier.py`
- `backend/features/chat/services/symptom_extraction_service.py`
- `backend/features/chat/services/conversation_state.py`
- `backend/features/chat/utils/message_builder.py`
- `backend/features/triage/services/diagnostic_question_service.py`
- `backend/features/chat/tests/test_smart_question_generation.py`
