"""Mock TTS — sine-wave WAV for tests and offline fallback."""

import asyncio

from features.voice.services.base import SpeechResult, TextToSpeechProvider
from features.voice.utils.audio_io import generate_sine_wav


class MockTextToSpeechProvider(TextToSpeechProvider):
    async def synthesize(self, text: str, language: str = "en") -> SpeechResult:
        del language
        await asyncio.sleep(0.05)

        duration = max(0.5, min(5.0, len(text) / 25))
        audio_bytes = generate_sine_wav(duration_sec=duration)

        return SpeechResult(
            audio_bytes=audio_bytes,
            content_type="audio/wav",
            duration_seconds=duration,
        )
