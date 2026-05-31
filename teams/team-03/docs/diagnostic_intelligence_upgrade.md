# Diagnostic Intelligence Upgrade

This document describes the upgrade that shifts PashuMitra AI from a sequential symptom checklist toward **veterinary triage-style reasoning**: persistent conversation memory, information-gain questioning, evidence-based confidence, disease differentiation, and explicit explanations. No new UI was added; all changes are backend and message content.

---

## 1. Previous behavior

| Area | Before |
|------|--------|
| **Conversation memory** | Animal type and symptoms were partially tracked, but age, sex, rejected symptoms, and ranked disease candidates were not consistently persisted across turns. |
| **Questions** | Follow-ups were largely sequential from CSV templates, without ranking by diagnostic value. |
| **Answer tracking** | Some duplicate questions could reappear when ordering changed. |
| **Confidence** | Simple overlap ratio (`matched / (matched + missing)`) tended to be **optimistic** when only one or two generic signs matched. |
| **Differentiation** | Multiple candidates were listed without explaining *why* one ranked above another. |
| **Finalization** | Diagnosis could proceed with moderate confidence even when key distinguishing signs were still unknown. |
| **Low confidence** | A weak leading score could still be presented as a firm preliminary diagnosis. |
| **Multilingual** | Limited Kannada/Hindi aliases; farmer phrases like `ಜ್ವರ` or `तिन्नुत्तಿಲ್ಲ` were often missed. |

---

## 2. Improved behavior

| Area | After |
|------|--------|
| **Conversation memory** | `ConversationState` persists animal type, age, sex, extracted/confirmed/rejected symptoms, asked/answered questions, and top disease candidates across turns. |
| **Questions** | Follow-ups are ranked by **information gain** (uncertainty reduction) using disease weights and candidate overlap. |
| **Answer tracking** | `asked_questions`, `answered_questions`, `asked_symptoms`, and `rejected_symptoms` prevent repeats. |
| **Confidence** | Weighted **positive / negative / missing evidence** model with contradicted-symptom penalty. |
| **Differentiation** | When two or more diseases remain plausible, a text summary explains matched vs missing signs per candidate. |
| **Early finalization** | At **≥ 85%** confidence with no high-value unanswered questions, questioning stops and diagnosis is delivered. |
| **Low confidence** | Below **40%**, the system does **not** force a diagnosis; it asks for more information. |
| **Explanations** | Every candidate includes matched symptoms, missing symptoms, contradicted symptoms, and a one-line confidence reason. |
| **Multilingual** | Expanded aliases in `symptoms.csv` map Kannada, Hindi, and English farmer language to canonical symptom IDs. |

**Example conversation flow**

```
User: "My goat has fever"
→ animal=goat, symptoms=[fever]

User: "It is not eating"
→ symptoms=[fever, reduced_appetite] — no re-ask for animal or fever
```

---

## 3. Conversation memory model

**Implementation:** `backend/features/chat/services/conversation_state.py`

`ConversationState` is rebuilt from chat history on each request and updated after every assistant turn.

### Persisted fields

| Field | Purpose |
|-------|---------|
| `animal_type` | cattle, buffalo, goat, sheep |
| `animal_age`, `animal_sex` | Extracted from natural language when mentioned |
| `extracted_symptoms` | Signs parsed from farmer messages |
| `confirmed_symptoms` | Signs confirmed via yes/no follow-ups |
| `rejected_symptoms` | Signs explicitly denied (used as negative evidence) |
| `asked_questions` / `answered_questions` | Prevent duplicate prompts |
| `asked_symptoms` / `answered_symptoms` | Symptom-level tracking for follow-ups |
| `candidate_disease_ids` / `top_candidate_diseases` | Latest ranked matches for differentiation |
| `active_question` / `active_symptom` | Current yes/no prompt context |

### Active symptom set

`active_symptoms()` merges extracted + confirmed symptoms and **excludes** anything in `rejected_symptoms`. This list drives retrieval and scoring on every turn.

### Candidate persistence

After each diagnosis pass, `DiagnosisOrchestrator` calls `record_candidate_matches()` so downstream messaging and question selection use the same ranked list.

---

## 4. Question selection model (information gain)

**Implementation:** `backend/features/triage/services/information_gain.py`, wired in `DiagnosticQuestionService`.

For each unanswered symptom linked to top disease candidates, the system estimates:

```
information_gain ≈ (max_weight × 2)
                 + (discrimination × 0.75)
                 + (high_value_bonus × 0.5)
                 + top_confidence_gap
                 + critical_triage_bonus
```

Where:

- **max_weight** — highest disease–symptom weight among top candidates for that symptom.
- **discrimination** — peaks when roughly half of candidates share the symptom (best at splitting hypotheses).
- **high_value_bonus** — extra weight when mapping weight ≥ 0.85 (e.g. mouth blisters for FMD, bloody discharge for anthrax).
- **top_confidence_gap** — larger gap between #1 and #2 candidates increases urgency to ask splitting questions.
- **critical_triage_bonus** — +0.75 when the symptom’s triage tier is `critical` (e.g. bloody discharge).

Questions are sorted by descending gain. Already asked, answered, reported, or rejected symptoms are skipped.

### Practical effect

| Disease | High-gain questions asked first |
|---------|----------------------------------|
| **FMD** | mouth blisters, drooling, hoof lesions |
| **Anthrax** | bloody discharge, sudden death, swelling |
| **LSD / mastitis / brucellosis** | disease-specific high-weight signs from `disease_symptom_mapping.csv` |

### Early stop during questioning

`DiagnosticQuestionService` returns no further questions when:

- Leading confidence ≥ **85%**, or
- Sufficient evidence already exists, or
- Six conversation questions have been asked, or
- Diagnosis is finalized.

---

## 5. Answer tracking

**Implementation:** `ConversationState.record_question()`, `confirm_symptom()`, `reject_symptom()`, and history replay in `from_messages()`.

| Set | Role |
|-----|------|
| `asked_questions` | Text keys of prompts already shown |
| `answered_questions` | Prompts the farmer responded to |
| `asked_symptoms` / `answered_symptoms` | Symptom IDs tied to yes/no flows |
| `rejected_symptoms` | Explicit “no” answers → negative evidence in scoring |

Rejected symptoms flow into `ConfidenceScoringService` and `DiseaseRetrievalService` so denied signs reduce confidence and are not re-asked.

---

## 6. Confidence model

**Implementation:** `backend/features/confidence_scoring/services/confidence_service.py`

### Evidence categories

For each disease profile symptom:

| Category | Meaning |
|----------|---------|
| **Positive (matched)** | Reported or confirmed by farmer |
| **Negative (contradicted)** | Farmer denied a sign that is part of the disease profile |
| **Missing** | Expected sign not yet reported or denied |

### Weighted formula (dataset-driven path)

When `disease_symptom_mapping.csv` weights exist:

```
confidence = matched_weight / denominator

denominator = matched_weight + missing_weight                    (no contradictions)
           OR matched_weight + missing_weight + (contradicted_weight × 1.5)   (with contradictions)
```

Scores are capped at 1.0. Contradictions use a **1.5× penalty** so ruling out a hallmark sign (e.g. no bloody discharge for anthrax) materially lowers confidence.

### Legacy unweighted path

When no mapping weights are available, the same structure applies using symptom counts instead of weights.

### Thresholds

| Constant | Value | Behavior |
|----------|-------|----------|
| `LOW_RELIABILITY_THRESHOLD` | 0.40 | Do not present a forced diagnosis; show reliability message |
| `FINAL_CONFIDENCE_THRESHOLD` | 0.70 | Standard finalize + SMS eligibility (unchanged) |
| `EARLY_FINALIZATION_THRESHOLD` | 0.85 | Stop questioning if no high-value pending questions |

---

## 7. Disease differentiation

**Implementation:** `backend/features/chat/utils/diagnosis_explanation.py` → `build_differentiation_summary()`

When two or more candidates remain, the assistant message includes a structured comparison:

```
Possible diseases:
1. Foot and Mouth Disease (82%)
2. Anthrax (44%)

Reason:
Foot and Mouth Disease:
  + fever, excessive salivation and drooling, blisters on tongue and gums
  - no blisters on hooves and between digits

Anthrax:
  + fever
  - no bloody discharge
```

The top candidate shows matched signs and notable missing hallmarks. The runner-up shows what still aligns and which distinguishing signs are absent.

---

## 8. Explanation engine

**Implementation:** `confidence_explanation.py`, `diagnosis_explanation.py`, `message_builder.py`

Each `DiseaseCandidate` in API responses now includes:

| Field | Content |
|-------|---------|
| `matched_symptoms` | Confirmed positive evidence |
| `missing_symptoms` | Expected but unconfirmed signs |
| `contradicted_symptoms` | Denied signs that hurt the match |
| `confidence_reason` | One-line rationale, e.g. “Strong match with Foot and Mouth Disease pattern.” |

**Low reliability message** (confidence &lt; 40%):

> I need more information to make a reliable assessment. Please describe what you see and answer any follow-up questions.

---

## 9. Multilingual symptom knowledge

**Implementation:** `backend/datasets/symptoms.csv` aliases (semicolon-separated)

Sample mappings added or expanded:

| Canonical | English | Kannada | Hindi |
|-----------|---------|---------|-------|
| fever | fever | ಜ್ವರ | बुखार |
| drooling | drooling | ಬಾಯಿ ನೀರು | मुंह से पानी |
| reduced appetite | not eating | ತಿನ್ನುತ್ತಿಲ್ಲ | खाना नहीं खा रहा |
| swelling | swelling | ಗಡ್ಡೆ | सूजन |
| lameness / hoof | leg pain, hoof lesions | ಕಾಲು ನೋವು | — |

Resolution path: farmer text → alias match in repository → canonical `symptom_id` → weighted scoring and follow-up selection.

---

## 10. Dataset quality audit

**Script:** `backend/scripts/audit_datasets.py`

Run from the backend directory:

```bash
cd backend
python scripts/audit_datasets.py
```

### Latest audit results (5 diseases, 34 symptoms)

| Check | Result |
|-------|--------|
| Missing follow-up questions | None |
| Weak mappings (weight &lt; 0.5) | None |
| Symptoms without aliases (≤ 1 alias) | None |
| Duplicate canonical names | None |
| Diseases with low coverage (&lt; 4 mapped symptoms) | None |

### Audit criteria

- **missing_followup_questions** — disease rows in `followup_questions.csv`
- **weak_mappings** — disease–symptom pairs with weight &lt; 0.5
- **symptoms_without_aliases** — symptoms with only the canonical name (no multilingual/farmer variants)
- **duplicate_canonical_names** — two symptom IDs sharing the same display name
- **diseases_low_coverage** — fewer than four weighted symptoms per disease

### Recommendations for future dataset work

1. Add more diseases beyond the current five (anthrax, FMD, LSD, mastitis, brucellosis).
2. Continue expanding Kannada/Hindi aliases for regional dialects.
3. Add age/sex-specific follow-ups where clinically relevant (memory fields exist; templates can grow).
4. Re-run the audit after each CSV edit in CI.

---

## 11. Key files changed

| File | Role |
|------|------|
| `features/chat/services/conversation_state.py` | Memory model |
| `features/triage/services/information_gain.py` | Question ranking |
| `features/triage/services/diagnostic_question_service.py` | Gain-ordered follow-ups |
| `features/confidence_scoring/services/confidence_service.py` | Evidence-based scoring |
| `features/confidence_scoring/utils/confidence_explanation.py` | Confidence reasons |
| `features/chat/utils/diagnosis_explanation.py` | Differentiation + thresholds |
| `features/chat/utils/diagnosis_flow.py` | Early finalize / low reliability gates |
| `features/chat/utils/message_builder.py` | Farmer-facing explanations |
| `features/chat/services/diagnosis_orchestrator.py` | Passes rejected symptoms; records candidates |
| `features/rag/schemas/disease.py` | `contradicted_symptoms`, `confidence_reason` on `DiseaseMatch` |
| `datasets/symptoms.csv` | Multilingual aliases |
| `scripts/audit_datasets.py` | Dataset QA |

---

## 12. Tests

**282 tests passing** in `backend/features/`, including:

- `test_information_gain.py` — ranking favors discriminative symptoms
- `test_evidence_confidence.py` — contradictions reduce scores; legacy path preserved
- Existing diagnosis, triage, conversation-state, and supported-animal suites

---

## Summary

PashuMitra AI now behaves more like a **triage assistant**: it remembers what the farmer already said, asks the most diagnostically useful question next, penalizes contradicted evidence, explains why competing diseases differ, finalizes early when evidence is strong, and refuses to over-commit when confidence is low—all without UI changes.
