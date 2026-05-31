"""Speech-to-text providers — Faster Whisper."""

import asyncio
import logging
import math
import os
import tempfile
from pathlib import Path

from features.voice.services.base import SpeechToTextProvider, STTProviderError, TranscriptionResult

logger = logging.getLogger(__name__)


class FasterWhisperSTTProvider(SpeechToTextProvider):
    """Transcribe uploaded audio using faster-whisper."""

    def __init__(self, model_size: str = "base", device: str = "cpu") -> None:
        self._model_size = model_size
        self._device = device
        self._model = None

    def _load_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel

            compute_type = "int8" if self._device == "cpu" else "float16"
            self._model = WhisperModel(
                self._model_size,
                device=self._device,
                compute_type=compute_type,
            )
        return self._model

    @staticmethod
    def _normalize_language_hint(language: str | None) -> str | None:
        if not language or language.strip().lower() in {"auto", ""}:
            return None
        return language.split("-")[0].lower()

    def _transcribe_sync(
        self,
        audio_bytes: bytes,
        filename: str | None,
        language: str | None,
    ) -> TranscriptionResult:
        suffix = Path(filename or "audio.webm").suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        requested = self._normalize_language_hint(language)

        try:
            model = self._load_model()
            transcribe_kwargs: dict = {
                "beam_size": 5,
                "vad_filter": True,
            }
            if requested:
                transcribe_kwargs["language"] = requested

            segments, info = model.transcribe(tmp_path, **transcribe_kwargs)
            segment_list = list(segments)
            text = " ".join(segment.text.strip() for segment in segment_list).strip()
            detected = (info.language or "en").split("-")[0].lower()
            result_language = requested or detected
            language_confidence = round(
                float(getattr(info, "language_probability", 0.85) or 0.85),
                2,
            )
            log_probs = [
                segment.avg_logprob
                for segment in segment_list
                if segment.avg_logprob is not None
            ]
            if log_probs:
                transcription_confidence = round(
                    sum(math.exp(value) for value in log_probs) / len(log_probs),
                    2,
                )
            else:
                transcription_confidence = 0.0 if not text else language_confidence

            logger.info(
                "faster-whisper transcribe requested=%s detected=%s result=%s "
                "transcription_conf=%.2f language_conf=%.2f",
                requested,
                detected,
                result_language,
                transcription_confidence,
                language_confidence,
            )

            return TranscriptionResult(
                text=text,
                language=result_language,
                confidence=transcription_confidence,
                language_confidence=language_confidence,
                provider="faster-whisper",
                fallback_used=False,
                requested_language=requested,
                detected_language=detected,
            )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str | None = None,
        *,
        language: str | None = None,
    ) -> TranscriptionResult:
        if not audio_bytes:
            requested = self._normalize_language_hint(language)
            return TranscriptionResult(
                text="",
                language=requested or "en",
                confidence=0.0,
                language_confidence=0.0,
                provider="faster-whisper",
                requested_language=requested,
            )

        try:
            return await asyncio.to_thread(
                self._transcribe_sync,
                audio_bytes,
                filename,
                language,
            )
        except Exception as exc:
            logger.warning("Faster Whisper failed (%s)", exc)
            raise STTProviderError(f"Faster Whisper failed: {exc}") from exc
