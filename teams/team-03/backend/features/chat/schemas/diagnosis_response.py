"""Aggregated diagnosis workflow response."""

from pydantic import BaseModel, ConfigDict, Field

from features.rag.schemas.disease import DiseaseMatch
from features.rag.schemas.responses import TriageResult
from features.sms_alerts.schemas.alert import AlertDraft
from features.triage.schemas.diagnostic import FollowUpQuestion


class DiagnosisResponse(BaseModel):
    """End-to-end diagnosis output from the orchestrated intelligence pipeline."""

    model_config = ConfigDict(validate_assignment=True)

    candidate_diseases: list[DiseaseMatch] = Field(
        default_factory=list,
        description="Ranked disease candidates from retrieval.",
    )
    followup_questions: list[FollowUpQuestion] = Field(
        default_factory=list,
        description="Adaptive questions when top candidates are ambiguous.",
    )
    triage_result: TriageResult = Field(
        ...,
        description="Rule-based severity classification for reported symptoms.",
    )
    sms_alert: AlertDraft | None = Field(
        default=None,
        description="SMS alert draft for the top disease candidate, if any.",
    )
    requires_more_information: bool = Field(
        ...,
        description="True when follow-up questions should be asked before finalizing diagnosis.",
    )
