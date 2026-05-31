from pydantic import BaseModel


class TranscribeResponse(BaseModel):
    text: str
    language: str = "en"
    confidence: float = 1.0
    language_confidence: float = 1.0
    provider: str = "unknown"
    fallback_used: bool = False
    requested_language: str | None = None
    detected_language: str | None = None
