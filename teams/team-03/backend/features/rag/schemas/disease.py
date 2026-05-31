"""Disease knowledge base and matching result models."""

from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel


class Disease(BaseModel):
    """Structured disease record used for retrieval and diagnostic scoring."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_min_length=1,
        validate_assignment=True,
    )

    disease_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Stable identifier for the disease.",
    )
    disease_name: str = Field(
        ...,
        min_length=1,
        max_length=256,
        description="Canonical disease name.",
    )
    animal_type: AnimalType = Field(
        ...,
        description="Livestock species this disease applies to.",
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Summary of the disease for retrieval and display.",
    )
    symptoms: list[str] = Field(
        ...,
        min_length=1,
        description="Symptom identifiers or labels associated with the disease.",
    )
    critical_symptoms: list[str] = Field(
        default_factory=list,
        description="Subset of symptoms that indicate urgent or critical escalation.",
    )
    first_aid: list[str] = Field(
        default_factory=list,
        description="Immediate care steps safe for farmers before veterinary help.",
    )
    severity_level: DiseaseSeverityLevel = Field(
        ...,
        description="Baseline severity of the disease in the knowledge base.",
    )

    @field_validator("symptoms", "critical_symptoms", "first_aid", mode="before")
    @classmethod
    def strip_list_items(cls, value: list[str] | None) -> list[str]:
        if value is None:
            return []
        return [item.strip() for item in value if item and item.strip()]

    @field_validator("symptoms")
    @classmethod
    def symptoms_non_empty(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("symptoms must contain at least one non-empty entry")
        return value

    @model_validator(mode="after")
    def critical_symptoms_subset_of_symptoms(self) -> Self:
        symptom_set = set(self.symptoms)
        invalid = [s for s in self.critical_symptoms if s not in symptom_set]
        if invalid:
            raise ValueError(
                "critical_symptoms must be a subset of symptoms; "
                f"unknown entries: {invalid}"
            )
        return self


class DiseaseMatch(BaseModel):
    """Scored alignment between reported symptoms and a candidate disease."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_min_length=1,
        validate_assignment=True,
    )

    disease_id: str = Field(..., min_length=1, max_length=64)
    disease_name: str = Field(..., min_length=1, max_length=256)
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalized match confidence in the range [0, 1].",
    )
    matched_symptoms: list[str] = Field(
        default_factory=list,
        description="Reported symptoms that align with the disease profile.",
    )
    missing_symptoms: list[str] = Field(
        default_factory=list,
        description="Expected disease symptoms not reported by the farmer.",
    )
    contradicted_symptoms: list[str] = Field(
        default_factory=list,
        description="High-value disease signs explicitly ruled out by the farmer.",
    )
    confidence_reason: str | None = Field(
        default=None,
        description="Short explanation of the confidence score.",
    )

    @field_validator("matched_symptoms", "missing_symptoms", "contradicted_symptoms", mode="before")
    @classmethod
    def strip_list_items(cls, value: list[str] | None) -> list[str]:
        if value is None:
            return []
        return [item.strip() for item in value if item and item.strip()]

    @model_validator(mode="after")
    def matched_missing_contradicted_disjoint(self) -> Self:
        overlap_m_m = set(self.matched_symptoms) & set(self.missing_symptoms)
        if overlap_m_m:
            raise ValueError(
                "matched_symptoms and missing_symptoms must not overlap; "
                f"conflicting entries: {sorted(overlap_m_m)}"
            )
        overlap_m_c = set(self.matched_symptoms) & set(self.contradicted_symptoms)
        if overlap_m_c:
            raise ValueError(
                "matched_symptoms and contradicted_symptoms must not overlap; "
                f"conflicting entries: {sorted(overlap_m_c)}"
            )
        return self
