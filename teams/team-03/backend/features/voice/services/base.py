"""Voice processing provider interfaces."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class TranscriptionResult:
    text: str
    language: str = "en"
    confidence: float = 1.0
    language_confidence: float = 1.0
    provider: str = "unknown"
    fallback_used: bool = False
    requested_language: str | None = None
    detected_language: str | None = None


@dataclass
class SpeechResult:
    audio_bytes: bytes
    content_type: str = "audio/wav"
    duration_seconds: float = 0.0
    voice: str | None = None
    language: str = "en"


class STTProviderError(Exception):
    """Raised when a speech-to-text provider fails."""


class SpeechToTextProvider(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str | None = None,
        *,
        language: str | None = None,
    ) -> TranscriptionResult:
        """Convert audio bytes to text."""


class TextToSpeechProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "en") -> SpeechResult:
        """Convert text to audio bytes."""
