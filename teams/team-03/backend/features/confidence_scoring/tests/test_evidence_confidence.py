"""Tests for evidence-based confidence scoring."""

from __future__ import annotations

import pytest

from features.confidence_scoring.services.confidence_service import ConfidenceScoringService
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel


@pytest.fixture
def service() -> ConfidenceScoringService:
    return ConfidenceScoringService(repository=None)


def test_rejected_symptoms_reduce_confidence(service: ConfidenceScoringService) -> None:
    disease = Disease(
        disease_id="anthrax",
        disease_name="Anthrax",
        animal_type=AnimalType.CATTLE,
        description="Anthrax",
        symptoms=[
            "high fever",
            "bloody discharge from natural openings",
            "sudden death without warning",
        ],
        severity_level=DiseaseSeverityLevel.CRITICAL,
    )
    without_rejection = service.score_disease(["high fever"], disease)
    with_rejection = service.score_disease(
        ["high fever"],
        disease,
        rejected_symptoms=["bloody discharge from natural openings"],
    )

    assert with_rejection.confidence_score < without_rejection.confidence_score
    assert with_rejection.contradicted_symptoms


def test_confidence_reason_populated(service: ConfidenceScoringService) -> None:
    disease = Disease(
        disease_id="mastitis",
        disease_name="Mastitis",
        animal_type=AnimalType.CATTLE,
        description="Mastitis",
        symptoms=["fever", "swollen painful udder quarter"],
        severity_level=DiseaseSeverityLevel.MEDIUM,
    )
    result = service.score_disease(["fever", "swollen painful udder quarter"], disease)
    assert result.confidence_reason
    assert "Mastitis" in result.confidence_reason
