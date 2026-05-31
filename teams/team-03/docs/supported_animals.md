# Supported Animals

PashuMitra AI diagnosis, triage, and diagnostic questions apply only to four livestock species.

## Supported species

| Canonical type | English | Kannada (script) | Hindi (script) |
|----------------|---------|------------------|----------------|
| `cattle` | cow, cattle | ಹಸು, ಹಸುವು, ಹಸುವಿಗೆ | गाय |
| `buffalo` | buffalo | ಎಮ್ಮೆ, ಎಮ್ಮೆಗೆ | भैंस |
| `goat` | goat | ಮೇಕೆ, ಮೇಕೆಗೆ | बकरी |
| `sheep` | sheep | ಕುರಿ, ಕುರಿಗೆ | भेड़ |

Romanized forms (e.g. `hasuvige`, `mekege`, `gai`, `bakri`) are also mapped via `farmer_language_dictionary.py` and `ANIMAL_RULES` in `symptom_extraction_service.py`.

## Not supported (diagnosis blocked)

- Pig (`pig`, `swine`, …)
- Poultry (`chicken`, `hen`, `duck`, …)
- Any other species

These may still be **detected** for messaging purposes but **must not** enter the diagnosis pipeline.

## Validation flow

Before diagnosis, triage, or diagnostic questions:

1. **Extract** animal type from the user message and conversation state.
2. **Check** `is_unsupported_animal_type(state.animal_type)`.
3. If unsupported, return only:

   > Currently PashuMitra AI supports cattle, buffalo, goat and sheep only.

No disease predictions, no follow-up questions, no triage continuation.

If no animal is mentioned, the session may proceed with symptoms only (default cattle at diagnosis time when species is unknown).

## Implementation

| File | Role |
|------|------|
| `features/chat/utils/supported_animals.py` | `SUPPORTED_ANIMAL_TYPES`, guard helpers, message constant |
| `features/chat/services/orchestrator.py` | Blocks before intake continuation and before `_run_diagnosis` |
| `features/chat/services/symptom_extraction_service.py` | `ANIMAL_RULES` keyword maps |
| `features/chat/utils/farmer_language_dictionary.py` | Native script + romanized maps |
| `features/chat/utils/farmer_messages.py` | Localized unsupported-animal message (kn, hi) |

## Tests

`backend/features/chat/tests/test_supported_animals.py`

## Example

| User message | Result |
|--------------|--------|
| My pig has fever | Unsupported message only |
| My goat has fever | Normal diagnostic flow |
| ನನ್ನ ಮೇಕೆಗೆ ಜ್ವರ ಇದೆ | Goat detected → diagnosis |
| Fever only (no animal) | Intake / diagnosis with default cattle |
