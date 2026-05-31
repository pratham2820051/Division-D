"""Diagnosis REST API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from features.chat.schemas.diagnosis_request import DiagnosisRequest
from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.chat.services.diagnosis_orchestrator import DiagnosisOrchestrator

router = APIRouter()


def get_diagnosis_orchestrator() -> DiagnosisOrchestrator:
    """FastAPI dependency that provides the diagnosis orchestrator."""
    return DiagnosisOrchestrator()


@router.post(
    "/diagnose",
    response_model=DiagnosisResponse,
    status_code=status.HTTP_200_OK,
    summary="Run livestock disease diagnosis",
    response_description="Diagnosis results including candidates, triage, and optional SMS alert.",
)
def diagnose_case(
    request: DiagnosisRequest,
    orchestrator: Annotated[DiagnosisOrchestrator, Depends(get_diagnosis_orchestrator)],
) -> DiagnosisResponse:
    """Run the full diagnosis workflow for the reported symptoms."""
    return orchestrator.diagnose(
        animal_type=request.animal_type.value,
        symptoms=request.symptoms,
    )
