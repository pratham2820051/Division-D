"""Symptom catalog models."""

from pydantic import BaseModel, ConfigDict, Field


class Symptom(BaseModel):
    """A single observable sign used during disease matching and triage."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_min_length=1,
        frozen=True,
    )

    symptom_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Stable identifier for the symptom (e.g. slug or UUID).",
        examples=["fever_high"],
    )
    name: str = Field(
        ...,
        min_length=1,
        max_length=256,
        description="Human-readable symptom label.",
        examples=["High fever"],
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional clinical detail or farmer-facing explanation.",
    )
