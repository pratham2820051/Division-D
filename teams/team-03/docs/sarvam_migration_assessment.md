# Sarvam AI Migration Assessment

**Date:** 2026-05-30  
**Scope:** Part B — feasibility of replacing Faster Whisper + Edge TTS with Sarvam AI

---

## Current stack

| Layer | Provider | Location |
|-------|----------|----------|
| STT | Faster Whisper (`base`, CPU) + mock fallback | `features/voice/services/stt_service.py` |
| TTS | Edge TTS (Neural voices) + mock fallback | `features/voice/services/tts_service.py` |
| Translation | Internal `translation_service` (chat blocks) | `features/chat/utils/localization.py` |

**Languages in demo:** English, Hindi, Kannada (+ Edge voices for ta, te, mr, ml, ur)

---

## Sarvam AI offering (public docs, May 2026)

| API | Pricing (INR) | Notes |
|-----|---------------|-------|
| Speech to Text | ₹30/hour | Per-second billing |
| STT + Translate | ₹30/hour | Transcribe + translate in one call |
| Sarvam Translate | ₹20 / 10K chars | Mayura / Sarvam Translate V1 |
| TTS Bulbul v2 | ₹15 / 10K chars | |
| TTS Bulbul v3 | ₹30 / 10K chars | Sub-250ms streaming via WebSocket |

**Languages:** 11 Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, **Kannada**, Punjabi, Odia, Assamese, Malayalam). English/Hinglish code-switching supported on TTS.

**Integration:** REST + WebSocket streaming; Python/Node SDKs; API key auth.

Sources: [Sarvam API pricing](https://docs.sarvam.ai/api-reference-docs/pricing), [TTS product page](https://www.sarvam.ai/tts-v2)

---

## Comparison matrix

| Criterion | Faster Whisper + Edge TTS | Sarvam AI |
|-----------|---------------------------|-----------|
| **Kannada STT accuracy** | Weak on `base`/CPU; local | Purpose-built for Indian languages |
| **Hindi STT** | Moderate | Strong |
| **English STT** | Good | Good (not primary focus) |
| **Demo reliability** | Depends on local GPU/CPU, WebM decode, silent mock fallback | Cloud API; consistent if network OK |
| **Latency (STT)** | 2–12s (cold model + CPU) | ~1–3s REST (estimate; streaming available) |
| **Latency (TTS)** | 1–4s Edge | Sub-250ms first byte (Bulbul v3 WebSocket) |
| **Offline / air-gap** | Possible (local Whisper) | Requires internet + API key |
| **Cost at demo scale** | Free (compute only) | ~₹0.008 per 1s audio STT; ~₹0.003 per 100 chars TTS |
| **Ops complexity** | Model download, ffmpeg, CPU load | API key, quota, error handling |
| **Translation** | Separate service | Native STT+Translate or Translate API |

---

## Integration effort estimate

| Task | Effort | Details |
|------|--------|---------|
| Sarvam STT provider class | **0.5–1 day** | Implement `SpeechToTextProvider`; map `language=kn|hi|en`; return confidence fields |
| Sarvam TTS provider class | **0.5 day** | Replace `EdgeTTSProvider`; map language → Sarvam voice id |
| Settings / env | **2 hours** | `SARVAM_API_KEY`, `VOICE_STT_PROVIDER=sarvam`, feature flag |
| Remove mock fallback on cloud path | **2 hours** | Fail loud with error JSON instead of mock |
| Translation consolidation | **1–2 days** | Optional: replace `localization.py` async translate with Sarvam Translate for kn/hi |
| Frontend changes | **Minimal** | Same `/voice/transcribe` contract; optional streaming TTS |
| Tests | **0.5 day** | Mock Sarvam responses; contract tests |
| **Total** | **~2–4 days** | No architecture redesign; swap providers behind existing facade |

**Files to touch:**

- `backend/features/voice/services/stt_service.py` — add `SarvamSTTProvider`
- `backend/features/voice/services/tts_service.py` — add `SarvamTTSProvider`
- `backend/features/voice/services/voice_service.py` — factory switch
- `backend/config/settings.py` — API key + provider enum
- `backend/requirements.txt` — Sarvam SDK (if used)

---

## Demo reliability verdict

| Scenario | Current | With Sarvam |
|----------|---------|-------------|
| Kannada voice in hackathon | **Unreliable** (Whisper base + WebM failures + mock) | **High** (designed for Kannada) |
| Hindi voice | **Mixed** | **High** |
| English voice | **OK** | **OK** |
| No internet demo | **OK** (local Whisper/mock) | **Fails** (needs API) |
| Consistent behavior | **Low** (silent fallback) | **Medium–High** (explicit API errors) |

**Recommendation:** Keep Faster Whisper as **offline fallback** behind a feature flag; use **Sarvam for demo/production** when API key and network are available.

---

## Migration plan (phased)

### Phase 1 — STT only (highest impact)

1. Add `SarvamSTTProvider` implementing existing `TranscriptionResult` contract.
2. Set `VOICE_STT_PROVIDER=sarvam` in demo `.env`.
3. Disable mock fallback when Sarvam returns HTTP error — surface error to frontend.
4. Validate kn/hi/en on real device recordings.

### Phase 2 — TTS

1. Add `SarvamTTSProvider` (Bulbul v3 for quality, v2 for cost).
2. Map `LanguageCode` → Sarvam locale.
3. Compare Edge vs Sarvam side-by-side in demo script.

### Phase 3 — Translation (optional)

1. Route `localize_blocks()` through Sarvam Translate for kn/hi.
2. Remove duplicate translation backend if redundant.

---

## Risks

| Risk | Mitigation |
|------|------------|
| API quota exhausted during demo | Pre-load credits; cache TTS for common phrases |
| Network latency in rural demo | Pre-record fallback clips; local Whisper backup |
| Vendor lock-in | Keep provider interface (`SpeechToTextProvider`) |
| English-only farmers | Sarvam handles English; verify STT locale auto-detect |

---

## Conclusion

**Sarvam is a strong fit for PashuMitra’s Kannada/Hindi voice demo** where current Whisper+WebM+mock pipeline is the main reliability bottleneck. Integration is **low–medium effort** (~2–4 days) because the project already uses a provider facade.

**Do not remove Faster Whisper immediately** — retain as offline/dev fallback until Sarvam path is validated on real farmer recordings in target languages.
