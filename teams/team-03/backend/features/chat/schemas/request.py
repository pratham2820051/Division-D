from pydantic import BaseModel, Field


class CreateChatRequest(BaseModel):
    title: str = Field(default="New chat", max_length=200)


class VoiceInputMetadata(BaseModel):
    transcription_confidence: float = Field(ge=0.0, le=1.0)
    language_confidence: float = Field(ge=0.0, le=1.0)
    requested_language: str | None = None
    detected_language: str | None = None
    fallback_used: bool = False


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    language: str = Field(default="en")
    voice_metadata: VoiceInputMetadata | None = None


class RenameChatRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
