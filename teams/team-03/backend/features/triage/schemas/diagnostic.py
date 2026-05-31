"""Schemas for adaptive diagnostic questioning."""

from pydantic import BaseModel, ConfigDict, Field


class FollowUpQuestion(BaseModel):
    """A deterministic follow-up question targeting a distinguishing symptom."""

    model_config = ConfigDict(str_strip_whitespace=True)

    question: str = Field(..., min_length=1, description="Farmer-facing yes/no question.")
    symptom: str = Field(..., min_length=1, description="Canonical symptom label being asked about.")
    disease_candidates: list[str] = Field(
        ...,
        min_length=1,
        description="Disease names that include this symptom in the ambiguous set.",
    )
