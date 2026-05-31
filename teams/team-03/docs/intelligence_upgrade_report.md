# PashuMitra AI — Intelligence Upgrade Report

Generated: 2026-05-30

## Problem (Before)

Farmer message:

> "Here you my gold has been affected with antax"

**Previous behavior:**

- `gold` not recognized as `goat` (ASR error)
- `antax` not mapped to `anthrax`
- No symptoms matched → generic intake: *"I need a little more information"*
- No disease candidate returned

The system was too literal: exact phrase matching only, no farmer language, no typo/ASR tolerance, no direct disease mention handling.

---

## Solution (After)

### 1. Text preprocessing pipeline

**File:** `backend/features/chat/utils/text_preprocessor.py`

Before symptom extraction:

1. Lowercase + whitespace normalization
2. ASR animal corrections (`gold` → `goat`)
3. Disease typo correction (`antax` → `anthrax`)
4. Farmer phrase → canonical symptom mapping

**Dictionary:** `backend/features/chat/utils/farmer_language_dictionary.py`

| Farmer phrase | Canonical symptom |
|---------------|-------------------|
| mouth water coming | drooling |
| not eating | reduced appetite |
| skin bumps | firm skin nodules on neck and body |
| milk reduced | reduced milk yield |
| walking problem | lameness and reluctance to walk |

### 2. Fuzzy symptom matching

**File:** `backend/features/chat/services/symptom_extraction_service.py`

- Added `rapidfuzz` partial/token matching (threshold 86)
- Handles spelling variants after preprocessing

### 3. Disease mention recognition

**File:** `backend/features/chat/services/disease_mention_recognizer.py`

```python
DiseaseMention(
    detected_disease="Anthrax",
    disease_id="anthrax",
    confidence=0.95,
    matched_alias="anthrax",
)
```

Supports:

- Direct names: anthrax, mastitis, FMD, LSD
- Typos: antax, antrax, anthraks, mastitus, mastaitis
- Aliases: lumpy disease, foot and mouth, fmd
- Transliterations: anthraks, anthrakku, goli roga

### 4. Confidence boosting

When a disease is explicitly mentioned:

| Disease | Boost |
|---------|-------|
| Anthrax | +0.30 |
| Mastitis | +0.30 |
| Lumpy Skin Disease | +0.30 |
| Other recognized diseases | +0.20 |

If no overlap match exists, the disease is still added as a candidate at the boost level.

### 5. Disease-specific diagnostic questions

**File:** `backend/features/triage/services/diagnostic_question_service.py`

| Candidate | Example question |
|-----------|------------------|
| Anthrax | Is there any bloody discharge from the nose or mouth? |
| FMD | Are there blisters in the mouth or on the feet? |
| Lumpy Skin Disease | Do you see hard skin nodules on the body? |
| Mastitis | Is the udder swollen, hot, or painful to touch? |

Asked when confidence is below 0.55 or when top diagnoses are ambiguous.

### 6. Orchestrator flow

**File:** `backend/features/chat/services/orchestrator.py`

Diagnosis now runs when **either** symptoms **or** a disease mention is detected (no longer requires both).

---

## Example: After behavior

**Input:** `"Here you my gold has been affected with antax"`

| Step | Result |
|------|--------|
| Preprocess | `"here you my goat has been affected with anthrax"` |
| Animal | Goat |
| Disease mention | Anthrax (confidence 0.95) |
| Diagnosis | Anthrax candidate at ≥ 0.30 confidence |
| Follow-up | Anthrax-specific bloody discharge question |

**Input:** `"My goat has anthrax"`

- Anthrax boosted immediately
- Disease-specific confirming questions for unreported critical symptoms

**Input:** `"Cow mouth water coming and mastitus"`

- Symptoms: drooling (+ fever if present)
- Disease mention: Mastitis
- Boosted Mastitis confidence

---

## Modified / new files

| File | Change |
|------|--------|
| `backend/features/chat/utils/farmer_language_dictionary.py` | **NEW** — farmer phrases, ASR, typos |
| `backend/features/chat/utils/text_preprocessor.py` | **NEW** — normalization pipeline |
| `backend/features/chat/services/disease_mention_recognizer.py` | **NEW** — disease detection + boost |
| `backend/features/chat/services/symptom_extraction_service.py` | Fuzzy matching + preprocessing |
| `backend/features/chat/services/orchestrator.py` | Disease mention → diagnosis path |
| `backend/features/chat/services/diagnosis_orchestrator.py` | Pass disease mention to retrieval |
| `backend/features/rag/services/disease_retrieval_service.py` | Apply confidence boost |
| `backend/features/triage/services/diagnostic_question_service.py` | Disease-specific questions |
| `backend/features/chat/tests/test_intelligence_upgrade.py` | **NEW** — 20+ tests |
| `backend/requirements.txt` | Added `rapidfuzz>=3.9.0` |

**Not modified:** frontend, HTTP API contracts, voice services, core diagnosis scoring formula.

---

## Accuracy improvements

| Scenario | Before | After |
|----------|--------|-------|
| ASR `gold` → goat | Default cattle | Goat detected |
| Typo `antax` | No match | Anthrax recognized |
| Disease-only message | Generic intake | Disease candidate + specific questions |
| Farmer phrase "mouth water coming" | Missed | Maps to drooling |
| `mastitus` / `mastaitis` | Missed | Mastitis mention detected |
| Direct "My goat has anthrax" | Weak/no match | +0.30 confidence boost |

---

## Run tests

```bash
cd backend
pip install -r requirements.txt
pytest features/chat/tests/test_intelligence_upgrade.py -v
pytest features/chat/tests/test_symptom_extraction.py -v
pytest features/chat/tests/test_diagnosis_orchestrator.py -v
```

---

## Dependencies

```
rapidfuzz>=3.9.0
```

Install with `pip install -r backend/requirements.txt`.
