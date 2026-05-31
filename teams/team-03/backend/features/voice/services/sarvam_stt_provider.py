"""Sarvam AI speech-to-text provider."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from config.settings import settings
from features.voice.services.base import (
    STTProviderError,
    SpeechToTextProvider,
    TranscriptionResult,
)

logger = logging.getLogger(__name__)

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

# PashuMitra UI language code → Sarvam BCP-47 language_code
UI_LANGUAGE_TO_SARVAM: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "kn": "kn-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "ml": "ml-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
}

SARVAM_TO_UI_LANGUAGE: dict[str, str] = {
    "en-in": "en",
    "hi-in": "hi",
    "kn-in": "kn",
    "mr-in": "mr",
    "ta-in": "ta",
    "te-in": "te",
    "ml-in": "ml",
    "bn-in": "bn",
    "gu-in": "gu",
    "pa-in": "pa",
}


class SarvamSTTError(STTProviderError):
    """Sarvam API or configuration failure."""


class SarvamSTTTimeoutError(SarvamSTTError):
    """Sarvam request exceeded the configured timeout."""


def _normalize_ui_language(language: str | None) -> str | None:
    if not language or language.strip().lower() in {"auto", ""}:
        return None
    return language.split("-")[0].lower()


def _sarvam_language_code(ui_language: str | None) -> str | None:
    normalized = _normalize_ui_language(ui_language)
    if not normalized:
        return None
    return UI_LANGUAGE_TO_SARVAM.get(normalized)


def _ui_from_sarvam_language(sarvam_code: str | None, requested: str | None) -> str:
    if sarvam_code:
        ui = SARVAM_TO_UI_LANGUAGE.get(sarvam_code.lower())
        if ui:
            return ui
    return requested or "en"


def _guess_mime_type(filename: str | None) -> str:
    if not filename:
        return "audio/webm"
    lower = filename.lower()
    if lower.endswith(".wav"):
        return "audio/wav"
    if lower.endswith(".mp3"):
        return "audio/mpeg"
    if lower.endswith(".ogg"):
        return "audio/ogg"
    if lower.endswith(".m4a") or lower.endswith(".mp4"):
        return "audio/mp4"
    return "audio/webm"


def _guess_input_audio_codec(filename: str | None) -> str | None:
    if not filename:
        return "webm"
    lower = filename.lower()
    if lower.endswith(".webm"):
        return "webm"
    if lower.endswith(".wav"):
        return "wav"
    if lower.endswith(".mp3"):
        return "mp3"
    if lower.endswith(".ogg"):
        return "ogg"
    if lower.endswith(".m4a") or lower.endswith(".mp4"):
        return "mp4"
    return None


def _select_sarvam_model(sarvam_language: str | None, configured_model: str) -> tuple[str, dict[str, str]]:
    """
    Use saarika:v2.5 when the farmer selected a specific UI language.

    saarika transcribes in the spoken language (Kannada stays Kannada script).
    saaras:v3 is kept for auto-detect / advanced modes only.
    """
    extra: dict[str, str] = {}
    if sarvam_language:
        return "saarika:v2.5", extra
    model = configured_model
    if model.startswith("saaras:"):
        extra["mode"] = settings.sarvam_stt_mode
    return model, extra


def _extract_transcript_from_payload(payload: dict[str, Any]) -> str:
    """Read transcript from Sarvam REST or wrapped response shapes."""
    for key in ("transcript", "text", "transcription"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    data = payload.get("data")
    if isinstance(data, dict):
        for key in ("transcript", "text", "transcription"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return ""


def _estimate_transcription_confidence(transcript: str, language_probability: float | None) -> float:
    text = transcript.strip()
    if not text:
        return 0.0
    if language_probability is not None:
        base = float(language_probability)
    else:
        base = 0.88
    if len(text) < 3:
        return round(min(base, 0.35), 2)
    if len(text.split()) < 2:
        return round(min(base, 0.55), 2)
    return round(min(base, 0.95), 2)


class SarvamSTTProvider(SpeechToTextProvider):
    """Transcribe audio via Sarvam AI REST API."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        mode: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self._api_key = (api_key if api_key is not None else settings.sarvam_api_key).strip()
        self._model = model or settings.sarvam_stt_model
        self._mode = mode or settings.sarvam_stt_mode
        self._timeout = timeout_seconds or settings.sarvam_stt_timeout_seconds

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str | None = None,
        *,
        language: str | None = None,
    ) -> TranscriptionResult:
        if not self._api_key:
            raise SarvamSTTError("SARVAM_API_KEY is not configured")
        if not audio_bytes:
            requested = _normalize_ui_language(language)
            return TranscriptionResult(
                text="",
                language=requested or "en",
                confidence=0.0,
                language_confidence=0.0,
                provider="sarvam",
                requested_language=requested,
            )

        requested = _normalize_ui_language(language)
        sarvam_language = _sarvam_language_code(language)
        upload_name = filename or "recording.webm"
        mime_type = _guess_mime_type(upload_name)

        model, model_extra = _select_sarvam_model(sarvam_language, self._model)
        form_data: dict[str, str] = {"model": model, **model_extra}
        if sarvam_language:
            form_data["language_code"] = sarvam_language

        audio_codec = _guess_input_audio_codec(upload_name)
        if audio_codec:
            form_data["input_audio_codec"] = audio_codec

        headers = {"api-subscription-key": self._api_key}
        files = {"file": (upload_name, audio_bytes, mime_type)}

        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    SARVAM_STT_URL,
                    headers=headers,
                    data=form_data,
                    files=files,
                )
        except httpx.TimeoutException as exc:
            elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
            logger.warning("Sarvam STT timeout after %.1fms", elapsed_ms)
            raise SarvamSTTTimeoutError(f"Sarvam STT timed out after {elapsed_ms}ms") from exc
        except httpx.HTTPError as exc:
            raise SarvamSTTError(f"Sarvam STT HTTP error: {exc}") from exc

        elapsed_ms = round((time.perf_counter() - started) * 1000, 1)

        if response.status_code >= 400:
            detail = response.text[:200]
            logger.warning(
                "Sarvam STT HTTP %s after %.1fms: %s",
                response.status_code,
                elapsed_ms,
                detail,
            )
            raise SarvamSTTError(f"Sarvam STT failed with status {response.status_code}")

        payload: dict[str, Any] = response.json()
        transcript = _extract_transcript_from_payload(payload)
        detected_sarvam = payload.get("language_code")
        language_probability = payload.get("language_probability")
        lang_prob = (
            round(float(language_probability), 2)
            if language_probability is not None
            else None
        )

        detected_ui = _ui_from_sarvam_language(
            str(detected_sarvam) if detected_sarvam else None,
            requested,
        )
        # Farmer-selected UI language + explicit Sarvam language_code is authoritative.
        if sarvam_language and requested:
            detected_ui = requested
        # Keep the farmer-selected UI language authoritative for downstream chat/TTS.
        result_language = requested or detected_ui
        if (
            requested
            and detected_ui
            and requested != detected_ui
            and lang_prob is not None
            and lang_prob >= 0.55
        ):
            logger.warning(
                "Sarvam language mismatch requested=%s detected=%s prob=%.2f",
                requested,
                detected_ui,
                lang_prob,
            )

        transcription_confidence = _estimate_transcription_confidence(transcript, lang_prob)
        language_confidence = lang_prob if lang_prob is not None else (
            0.9 if sarvam_language else transcription_confidence
        )

        logger.info(
            "Sarvam STT model=%s requested=%s sarvam_code=%s detected=%s transcript_len=%d "
            "transcription_conf=%.2f language_conf=%.2f latency_ms=%.1f",
            model,
            requested,
            sarvam_language,
            detected_ui,
            len(transcript),
            transcription_confidence,
            language_confidence,
            elapsed_ms,
        )

        return TranscriptionResult(
            text=transcript,
            language=result_language,
            confidence=transcription_confidence,
            language_confidence=language_confidence,
            provider="sarvam",
            fallback_used=False,
            requested_language=requested,
            detected_language=detected_ui,
        )
