"""Schemas for structured symptom extraction from farmer messages."""

from pydantic import BaseModel, ConfigDict, Field

from features.rag.schemas.enums import AnimalType


class SymptomExtractionResult(BaseModel):
    """Structured symptoms and animal context extracted from free-form text."""

    model_config = ConfigDict(validate_assignment=True)

    animal_type: AnimalType = Field(
        ...,
        description="Detected or inferred livestock species.",
    )
    symptoms: list[str] = Field(
        default_factory=list,
        description="Canonical symptom labels aligned with the disease knowledge base.",
    )
