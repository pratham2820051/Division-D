"""Mock STT for tests and offline fallback."""

import asyncio
import random

from features.voice.services.base import SpeechToTextProvider, TranscriptionResult

_MOCK_TRANSCRIPTIONS: dict[str, list[str]] = {
    "en": [
        "My cow has fever since yesterday",
        "Goat has swelling in the front leg",
        "Buffalo is weak and not eating properly",
    ],
    "kn": [
        "ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ ಇದೆ",
        "ನನ್ನ ಆಡಿಗೆ ಕಾಲು ಊನವಾಗಿದೆ",
        "ಹಸು ತಿನ್ನುವುದಿಲ್ಲ ಮತ್ತು ದುರ್ಬಲವಾಗಿದೆ",
    ],
    "hi": [
        "मेरी गाय को बुखार है",
        "भैंस खाना नहीं खा रही",
    ],
    "mr": [
        "माझ्या गाईला ताप आहे",
        "माझी महिस खात नाही",
    ],
}


class MockSpeechToTextProvider(SpeechToTextProvider):
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str | None = None,
        *,
        language: str | None = None,
    ) -> TranscriptionResult:
        await asyncio.sleep(0.05)

        lang = (language or "en").split("-")[0].lower()
        if not audio_bytes:
            return TranscriptionResult(
                text="",
                language=lang,
                confidence=0.0,
                language_confidence=0.0,
                provider="mock",
                requested_language=lang,
                detected_language=lang,
            )

        samples = _MOCK_TRANSCRIPTIONS.get(lang, _MOCK_TRANSCRIPTIONS["en"])
        text = random.choice(samples)
        return TranscriptionResult(
            text=text,
            language=lang,
            confidence=0.92,
            language_confidence=0.92,
            provider="mock",
            fallback_used=False,
            requested_language=lang,
            detected_language=lang,
        )
