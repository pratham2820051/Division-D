"""Text-to-speech providers — Edge TTS with mock fallback."""

import asyncio
import logging

from config.settings import settings
from features.voice.services.base import SpeechResult, TextToSpeechProvider
from features.voice.services.mock_tts import MockTextToSpeechProvider

logger = logging.getLogger(__name__)

# Indian locale voices for hackathon languages
EDGE_VOICE_BY_LANGUAGE: dict[str, str] = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "kn": "kn-IN-SapnaNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "mr": "mr-IN-AarohiNeural",
    "ml": "ml-IN-SobhanaNeural",
    "ur": "ur-PK-UzmaNeural",
}


class EdgeTTSProvider(TextToSpeechProvider):
    """Generate speech using Microsoft Edge neural voices."""

    def __init__(self, default_voice: str | None = None) -> None:
        self._default_voice = default_voice or settings.tts_voice

    def _resolve_voice(self, language: str) -> str:
        return EDGE_VOICE_BY_LANGUAGE.get(language, self._default_voice)

    async def _synthesize_edge(self, text: str, voice: str) -> bytes:
        import edge_tts

        communicate = edge_tts.Communicate(text, voice)
        chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        return b"".join(chunks)

    async def synthesize(self, text: str, language: str = "en") -> SpeechResult:
        trimmed = text.strip()
        if not trimmed:
            return SpeechResult(
                audio_bytes=b"",
                content_type="audio/mpeg",
                duration_seconds=0.0,
                voice=None,
                language=language,
            )

        voice = self._resolve_voice(language)
        logger.info(
            "Edge TTS language=%s voice=%s text_len=%d",
            language,
            voice,
            len(trimmed),
        )
        try:
            audio_bytes = await self._synthesize_edge(trimmed, voice)
            duration = max(0.5, min(120.0, len(trimmed) / 14))
            return SpeechResult(
                audio_bytes=audio_bytes,
                content_type="audio/mpeg",
                duration_seconds=duration,
                voice=voice,
                language=language,
            )
        except Exception as exc:
            logger.warning(
                "Edge TTS failed (%s) language=%s voice=%s, using mock TTS",
                exc,
                language,
                voice,
            )
            mock = await MockTextToSpeechProvider().synthesize(trimmed, language=language)
            return SpeechResult(
                audio_bytes=mock.audio_bytes,
                content_type=mock.content_type,
                duration_seconds=mock.duration_seconds,
                voice=voice,
                language=language,
            )
