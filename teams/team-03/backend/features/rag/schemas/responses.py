"""API and service response models for triage and alerts."""

from pydantic import BaseModel, ConfigDict, Field

from features.rag.schemas.enums import MessageLanguage, TriageSeverity


class TriageResult(BaseModel):
    """Severity classification produced after symptom analysis."""

    model_config = ConfigDict(validate_assignment=True)

    severity: TriageSeverity = Field(
        ...,
        description="Recommended urgency level for the reported case.",
    )
    reason: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Plain-language justification for the assigned severity.",
    )


class SmsDraft(BaseModel):
    """Farmer-facing SMS message ready for translation or dispatch."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
    )

    language: MessageLanguage = Field(
        ...,
        description="BCP-47-style language code for the message body.",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=1600,
        description="SMS body; kept within typical multi-part SMS limits.",
    )
