"""Voice service facade — wires STT/TTS providers."""

import logging

from config.settings import settings
from features.voice.services.base import (
    SpeechResult,
    SpeechToTextProvider,
    TextToSpeechProvider,
    TranscriptionResult,
)
from features.voice.services.mock_stt import MockSpeechToTextProvider
from features.voice.services.mock_tts import MockTextToSpeechProvider
from features.voice.services.sarvam_stt_provider import SarvamSTTProvider
from features.voice.services.stt_chain import ChainedSTTProvider
from features.voice.services.stt_service import FasterWhisperSTTProvider
from features.voice.services.tts_service import EdgeTTSProvider

logger = logging.getLogger(__name__)


def _build_whisper_provider() -> SpeechToTextProvider:
    return FasterWhisperSTTProvider(
        model_size=settings.whisper_model,
        device=settings.whisper_device,
    )


def _build_sarvam_provider() -> SarvamSTTProvider | None:
    if not settings.sarvam_api_key.strip():
        return None
    return SarvamSTTProvider()


def _build_stt_provider() -> SpeechToTextProvider:
    provider = settings.voice_stt_provider.lower().strip()
    mock = MockSpeechToTextProvider()

    if provider == "mock":
        return mock

    sarvam = _build_sarvam_provider()
    whisper = _build_whisper_provider()

    if provider in {"sarvam", "auto"}:
        if sarvam is None:
            if provider == "sarvam":
                raise RuntimeError("VOICE_STT_PROVIDER=sarvam requires SARVAM_API_KEY")
            logger.warning(
                "VOICE_STT_PROVIDER=auto but SARVAM_API_KEY is missing; using mock STT",
            )
            return mock
        if provider == "auto":
            logger.info("VOICE_STT_PROVIDER=auto resolved to Sarvam STT only")
        return sarvam

    if provider in {"whisper", "faster-whisper"}:
        return whisper

    return ChainedSTTProvider([("faster-whisper", whisper)], mock_fallback=mock)


def _build_tts_provider() -> TextToSpeechProvider:
    provider = settings.voice_tts_provider.lower()

    if provider == "mock":
        return MockTextToSpeechProvider()

    if provider in {"edge-tts", "edge", "auto"} or settings.tts_engine == "edge-tts":
        return EdgeTTSProvider(settings.tts_voice)

    return MockTextToSpeechProvider()


class VoiceService:
    def __init__(
        self,
        stt: SpeechToTextProvider | None = None,
        tts: TextToSpeechProvider | None = None,
    ) -> None:
        self._stt = stt or _build_stt_provider()
        self._tts = tts or _build_tts_provider()

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str | None = None,
        *,
        language: str | None = None,
    ) -> TranscriptionResult:
        return await self._stt.transcribe(
            audio_bytes,
            filename=filename,
            language=language,
        )

    async def speak(self, text: str, language: str = "en") -> SpeechResult:
        result = await self._tts.synthesize(text, language=language)
        if result.voice:
            logger.info(
                "TTS speak language=%s voice=%s duration=%.1fs",
                result.language,
                result.voice,
                result.duration_seconds,
            )
        return result


voice_service = VoiceService()

