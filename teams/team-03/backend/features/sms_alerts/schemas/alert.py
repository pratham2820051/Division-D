"""Schemas for veterinary SMS alert drafts."""

from pydantic import BaseModel, ConfigDict, Field, field_validator

from features.rag.schemas.enums import TriageSeverity

MAX_ALERT_MESSAGE_LENGTH = 1000


class AlertDraft(BaseModel):
    """Structured veterinary alert ready for SMS or WhatsApp dispatch."""

    model_config = ConfigDict(str_strip_whitespace=True, validate_assignment=True)

    animal_type: str = Field(..., min_length=1, max_length=64)
    suspected_disease: str = Field(..., min_length=1, max_length=256)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    severity: TriageSeverity = Field(..., description="Triage severity for the reported case.")
    symptoms: list[str] = Field(default_factory=list)
    message: str = Field(
        ...,
        min_length=1,
        max_length=MAX_ALERT_MESSAGE_LENGTH,
        description="Plain-text alert body with real line breaks (SMS / general copy).",
    )
    whatsapp_message: str = Field(
        ...,
        min_length=1,
        max_length=MAX_ALERT_MESSAGE_LENGTH,
        description="WhatsApp-ready alert with *bold* labels and line breaks.",
    )

    @field_validator("symptoms", mode="before")
    @classmethod
    def strip_symptoms(cls, value: list[str] | None) -> list[str]:
        if value is None:
            return []
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]
