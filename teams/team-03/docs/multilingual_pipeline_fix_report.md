# Multilingual Pipeline Fix Report

**Date:** 2026-05-30  
**Input examples:** `Nanna hasuvige jwara bandide` (Kannada), `Meri gai ko bukhar hai` (Hindi)

---

## Summary

| Bug | Root cause | Fix |
|-----|------------|-----|
| Mock translation `[ಕನ್ನಡ] English...` | Groq 429/errors → `MockTranslationProvider` added demo prefix | Groq → **StaticPhrase** → Mock (no prefix unless `TRANSLATION_PROVIDER=mock`) |
| `conversation.language = en` for Kannada text | No inference from romanized/script input; UI default `en` won | `infer_language_from_message()` + updated priority in `resolve_conversation_language()` |
| "Which animal is affected?" | `hasuvu`/`jwara` not in extraction dictionaries | Romanized Kannada/Hindi animal + symptom mappings |
| English assistant blocks | Same translation fallback issue | Static Kannada/Hindi phrases + Groq for dynamic text |
| Validation | Missing end-to-end tests | `test_multilingual_pipeline_fix.py` |

---

## Bug 1 — Translation Fallback

### Observed
```
[ಕನ್ನಡ] I have a few questions to identify the disease.
```

### Audit findings

| Check | Result |
|-------|--------|
| Active provider (auto + `GROQ_API_KEY` set) | `GroqTranslationProvider` |
| Why mock was used | Groq rate limit / API errors → silent fallback to `MockTranslationProvider` |
| `GROQ_API_KEY` loaded | Yes (via Pydantic `Settings`, `.env` present) |
| Init before env | Module singleton now uses `get_translation_service()` lazy init |
| Silent fallback | **Yes** — Groq caught exceptions and called mock with prefix |

### Fix

**Provider chain:** `Groq → StaticPhraseTranslationProvider → MockTranslationProvider`

- **Static phrases:** Real Kannada/Hindi for orchestrator copy (intros, labels, common questions, FMD name)
- **Mock last resort:** Returns English **without** `[ಕನ್ನಡ]` prefix unless `TRANSLATION_PROVIDER=mock`
- **Logging:** Provider name at startup; per-request debug in `localize_blocks`; Groq failure logs fallback type

### Before / After

| English source | Before (mock) | After (static/Groq) |
|----------------|-----------------|---------------------|
| I have a few questions to identify the disease. | `[ಕನ್ನಡ] I have a few questions...` | `ರೋಗವನ್ನು ಗುರುತಿಸಲು ನಾನು ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ.` |
| Disease analysis | `[ಕನ್ನಡ] Disease analysis` | `ರೋಗ ವಿಶ್ಲೇಷಣೆ` |

---

## Bug 2 — Language Preservation

### Pipeline audit

```
Input "Nanna hasuvige jwara bandide"
  ↓ infer_language_from_message() → kn  ✅ NEW
  ↓ resolve_conversation_language(en UI, inferred=kn) → kn  ✅
  ↓ ChatService conversation_language=kn
  ↓ localize_blocks(..., kn)
  ↓ Frontend persistConversationLanguage(kn)
  ↓ TTS language=kn → kn-IN-SapnaNeural
```

### Priority (implemented)

1. **Explicit non-English UI** (dropdown = Kannada/Hindi)
2. **STT detected language** (voice metadata)
3. **Text inference** (Unicode script + romanized hints: `nanna`, `hasuvu`, `jwara`, `meri`, `gai`, `bukhar`)
4. **English fallback**

### Before / After

| Input | UI lang | Before | After |
|-------|---------|--------|-------|
| Nanna hasuvige jwara bandide | en | `en` | `kn` |
| Meri gai ko bukhar hai | en | `en` | `hi` |
| My cow has fever | en | `en` | `en` |

---

## Bug 3 — Kannada/Hindi Animal Extraction

### Mappings added

**Kannada (romanized):** `hasu`, `hasuvu`, `hasuvige` → cow/cattle; `emme` → buffalo; `meke` → goat; `kuri` → sheep  

**Hindi (romanized):** `gai`, `gaay` → cattle; `bhains` → buffalo; `bakri` → goat  

**Symptoms:** `jwara`, `bukhar`, `taap` → fever  

Applied in `preprocess_farmer_message()` before rule extraction; `conversation_state` uses preprocessed text for animal keyword detection.

### Before / After

| Input | Animal before | Animal after | Question before | Question after |
|-------|---------------|--------------|-----------------|----------------|
| Nanna hasuvige jwara bandide | (none → generic intake) | **cattle** | Which animal is affected? | Diagnostic follow-up for fever |
| Meri gai ko bukhar hai | (none) | **cattle** | Which animal is affected? | Diagnostic follow-up |

---

## Bug 4 — Response Language

When `conversation.language == kn`:

- System messages via `farmer_messages` (voice unclear, guardrail)
- Orchestrator copy via static phrases + Groq
- Diagnostic question **content** synced to translated `payload.question`
- Block labels (`Disease analysis`, `First-aid instructions`) translated
- No `[ಕನ್ನಡ]` prefix in production path

**TTS voices (unchanged, verified):**

| Language | Voice |
|----------|-------|
| kn | `kn-IN-SapnaNeural` |
| hi | `hi-IN-SwaraNeural` |
| en | `en-IN-NeerjaNeural` |

---

## Bug 5 — Validation

### Automated tests

```bash
cd backend
py -m pytest features/chat/tests/test_multilingual_pipeline_fix.py -v
```

Covers:
- Language inference (Kannada/Hindi roman + script)
- Animal + fever extraction
- Skips "Which animal" for Kannada cow+fever input
- Static translation produces real Kannada (no mock prefix)
- Conversation state sets `cattle` from `hasuvige`

### Manual verification

1. Restart backend (`uvicorn` reload)
2. Type: `Nanna hasuvige jwara bandide`
3. Check logs:
   ```
   Chat language resolved ... text_inferred=kn active=kn
   Translation provider: auto -> Groq (model=...)
   localize_blocks language=kn provider=...
   Edge TTS language=kn voice=kn-IN-SapnaNeural
   ```
4. Response intros/questions in Kannada script (not `[ಕನ್ನಡ]` prefix)
5. Repeat with `Meri gai ko bukhar hai` → Hindi

### Recommended `.env`

```env
GROQ_API_KEY=your_key
TRANSLATION_PROVIDER=auto
USE_GROQ_EXTRACTION=false   # optional: reduce Groq quota pressure
```

---

## Files Changed

| Area | Path |
|------|------|
| Language inference | `backend/features/chat/utils/message_language.py` |
| Language resolution | `backend/features/chat/utils/conversation_language.py` |
| Romanized dictionaries | `backend/features/chat/utils/farmer_language_dictionary.py` |
| Animal/symptom rules | `backend/features/chat/services/symptom_extraction_service.py` |
| Conversation state | `backend/features/chat/services/conversation_state.py` |
| Static translation | `backend/features/translation/services/static_translation_provider.py` |
| Translation service | `backend/features/translation/services/translation_service.py` |
| Mock provider | `backend/features/translation/services/mock_provider.py` |
| Localization | `backend/features/chat/utils/localization.py` |
| Frontend inference | `frontend/src/lib/voice-language.ts` |
| Frontend dispatch | `frontend/src/hooks/use-chat-orchestration.ts` |
| Tests | `backend/features/chat/tests/test_multilingual_pipeline_fix.py` |

---

## Known Limitations

1. **Groq quota** — Dynamic disease names / long first-aid still need Groq; static covers common UI phrases only.
2. **Romanized detection** — Heuristic token lists; very short ambiguous messages may stay English.
3. **UI chrome** — Card section headers in React may still show English labels; assistant **content** is localized.
