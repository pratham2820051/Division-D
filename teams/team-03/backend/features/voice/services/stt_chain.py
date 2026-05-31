"""Chained STT provider with ordered fallbacks."""

from __future__ import annotations

import logging
from dataclasses import replace

from features.voice.services.base import (
    STTProviderError,
    SpeechToTextProvider,
    TranscriptionResult,
)

logger = logging.getLogger(__name__)

MIN_AUDIO_BYTES = 256


def _has_transcript(result: TranscriptionResult) -> bool:
    return bool(result.text and result.text.strip())


class ChainedSTTProvider(SpeechToTextProvider):
    """Try providers in order; optionally fall back to mock STT."""

    def __init__(
        self,
        providers: list[tuple[str, SpeechToTextProvider]],
        *,
        mock_fallback: SpeechToTextProvider | None = None,
    ) -> None:
        if not providers:
            raise ValueError("At least one STT provider is required")
        self._providers = providers
        self._mock_fallback = mock_fallback

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str | None = None,
        *,
        language: str | None = None,
    ) -> TranscriptionResult:
        last_error: Exception | None = None

        if not audio_bytes or len(audio_bytes) < MIN_AUDIO_BYTES:
            last_error = STTProviderError("audio too short or empty")
            logger.warning(
                "STT skipped primary providers: audio_bytes=%d",
                len(audio_bytes),
            )
        else:
            for index, (name, provider) in enumerate(self._providers):
                try:
                    result = await provider.transcribe(
                        audio_bytes,
                        filename,
                        language=language,
                    )
                    if not _has_transcript(result):
                        last_error = STTProviderError(
                            f"{name} returned empty transcript",
                        )
                        logger.warning(
                            "STT provider %s returned empty transcript (provider=%s)",
                            name,
                            result.provider,
                        )
                        continue
                    if index == 0:
                        return result
                    logger.info("STT fallback succeeded with provider=%s", name)
                    return replace(
                        result,
                        fallback_used=True,
                        provider=result.provider,
                    )
                except Exception as exc:
                    last_error = exc
                    logger.warning("STT provider %s failed: %s", name, exc)

        if self._mock_fallback is not None:
            logger.warning("All primary STT providers failed; using mock fallback")
            mock_result = await self._mock_fallback.transcribe(
                audio_bytes,
                filename,
                language=language,
            )
            return replace(
                mock_result,
                fallback_used=True,
                provider="mock",
            )

        raise STTProviderError("All STT providers failed") from last_error
