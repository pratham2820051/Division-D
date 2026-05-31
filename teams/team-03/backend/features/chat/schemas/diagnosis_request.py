"""Request schema for the diagnosis API."""

from pydantic import BaseModel, ConfigDict, Field, field_validator

from features.rag.schemas.enums import AnimalType


class DiagnosisRequest(BaseModel):
    """Farmer-reported animal context and symptoms for diagnosis."""

    model_config = ConfigDict(str_strip_whitespace=True)

    animal_type: AnimalType = Field(
        ...,
        description="Livestock species being assessed.",
        examples=[AnimalType.CATTLE],
    )
    symptoms: list[str] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Observed symptoms reported by the farmer.",
        examples=[["high fever", "drooling"]],
    )

    @field_validator("symptoms", mode="before")
    @classmethod
    def validate_symptoms(cls, value: list[str]) -> list[str]:
        if not isinstance(value, list):
            raise TypeError("symptoms must be a list of strings")
        normalized = [item.strip() for item in value if isinstance(item, str) and item.strip()]
        if not normalized:
            raise ValueError("symptoms must contain at least one non-empty entry")
        return normalized
