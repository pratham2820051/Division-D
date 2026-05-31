# Diagnostic Question Quality Report

**Date:** 2026-05-30  
**Scope:** Disease-specific follow-up questions

---

## Root Cause

**Primary:** `DiagnosticQuestionService` preferred **generic distinguishing-symptom questions** (`"Does the animal have {symptom}?"`) computed across all ambiguous diseases. Curated farmer-friendly templates in `DISEASE_SPECIFIC_QUESTIONS` were only used for single-leader cases and often **skipped** because:

1. Template symptom keys (e.g. `excessive salivation and drooling`) did not exactly match disease catalog labels (e.g. `drooling`) without equivalence expansion
2. Ambiguous mode iterated generic symptoms before disease templates
3. Round-robin across diseases was missing — first disease consumed all 3 question slots

**Result:** Farmers saw the same generic phrasing regardless of suspected disease (mastitis milk question for fever, etc.).

---

## Fixes Applied

| Change | Detail |
|--------|--------|
| Template-first generation | Questions come from `DISEASE_SPECIFIC_QUESTIONS` for top candidate diseases |
| Equivalence-aware matching | `expand_normalized_symptoms()` links templates to catalog symptoms |
| Round-robin across diseases | Max 3 questions, one per disease per round when ambiguous |
| Generic fallback last | `"Does the animal have…"` only when no curated template exists |
| LSD template added | Swollen lymph nodes question |
| Sort stability | Tie-break candidates by confidence desc, name asc |

**Files:** `backend/features/triage/services/diagnostic_question_service.py`  
**Tests:** `backend/features/triage/tests/test_question_quality_paths.py`

---

## Before / After

### Before

```
Input: My cow has high fever
Question: Is the milk watery, clotted, or bloody?   (mastitis template from ambiguous pool)
Next:     Are there blisters on the feet…             (generic)
Next:     Does the animal have depression…            (generic)
```

Same pattern for FMD, anthrax, LSD — felt like one script.

### After

Each disease path leads with its own curated veterinary question.

---

## Validated Disease Paths

### Anthrax

| Field | Value |
|-------|-------|
| Input symptoms | `high fever` |
| Candidate | Anthrax |
| Generated questions | Is there any bloody discharge from the nose or mouth? |

### Foot and Mouth Disease

| Field | Value |
|-------|-------|
| Input symptoms | `high fever` |
| Candidate | Foot and Mouth Disease |
| Generated questions | Are there blisters in the mouth or on the tongue? |

### Mastitis

| Field | Value |
|-------|-------|
| Input symptoms | `fever` |
| Candidate | Mastitis |
| Generated questions | Is the udder swollen, hot, or painful to touch? |

### Lumpy Skin Disease

| Field | Value |
|-------|-------|
| Input symptoms | `high fever` |
| Candidate | Lumpy Skin Disease |
| Generated questions | Do you see hard skin nodules or lumps on the body? |

### Ambiguous fever (multi-disease)

When anthrax, FMD, and LSD tie on `high fever`, questions rotate:

1. Anthrax — bloody discharge  
2. Foot and Mouth Disease — mouth blisters  
3. Lumpy Skin Disease — skin nodules  

All three question texts are **distinct** (no generic `"Does the animal have…"`).

---

## Tests

```bash
cd backend
.\.venv\Scripts\python.exe -m pytest features/triage/tests/test_question_quality_paths.py -q
```

| Test | Validates |
|------|-----------|
| `test_anthrax_path_asks_bloody_discharge` | Anthrax-specific wording |
| `test_fmd_path_asks_mouth_or_hoof_blisters` | FMD blister question |
| `test_mastitis_path_asks_udder_or_milk` | Mastitis udder question |
| `test_lumpy_skin_disease_path_asks_nodules` | LSD nodule question |
| `test_ambiguous_fever_questions_differ_by_disease` | 3 distinct questions |
| `test_questions_never_exceed_three` | Max 3 cap |

**132 tests** pass across triage + chat + voice suites.

---

## Farmer Experience Goal

> The assistant should feel like a veterinarian narrowing **one disease at a time**, not reading the same checklist for every animal.

This is now enforced by template-first, disease-ranked question generation with generic fallback only as a last resort.
