"""Inbound request models for RAG-backed chat and triage."""

from pydantic import BaseModel, ConfigDict, Field, field_validator

from features.rag.schemas.enums import AnimalType


class ChatSymptomRequest(BaseModel):
    """Symptom report payload for chat-driven disease retrieval."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_min_length=1,
    )

    animal_type: AnimalType = Field(
        ...,
        description="Species of the animal being assessed.",
    )
    symptoms: list[str] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Free-text or catalog symptom labels reported by the farmer.",
    )

    @field_validator("symptoms", mode="before")
    @classmethod
    def normalize_symptoms(cls, value: list[str]) -> list[str]:
        if not isinstance(value, list):
            raise TypeError("symptoms must be a list of strings")
        normalized = [item.strip() for item in value if isinstance(item, str) and item.strip()]
        if not normalized:
            raise ValueError("symptoms must contain at least one non-empty entry")
        return normalized
