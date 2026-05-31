"""Unit tests for ConfidenceScoringService."""

import pytest

from features.confidence_scoring.services.confidence_service import ConfidenceScoringService
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel


@pytest.fixture
def service() -> ConfidenceScoringService:
    return ConfidenceScoringService()


@pytest.fixture
def sample_disease() -> Disease:
    return Disease(
        disease_id="mastitis",
        disease_name="Mastitis",
        animal_type=AnimalType.CATTLE,
        description="Udder inflammation in dairy cattle.",
        symptoms=[
            "swollen painful udder quarter",
            "hot udder to touch",
            "fever",
            "reduced milk yield",
        ],
        critical_symptoms=["fever"],
        first_aid=["Contact a veterinarian."],
        severity_level=DiseaseSeverityLevel.MEDIUM,
    )


def test_perfect_match(service: ConfidenceScoringService, sample_disease: Disease) -> None:
    user_symptoms = list(sample_disease.symptoms)

    result = service.score_disease(user_symptoms, sample_disease)

    assert result.confidence_score == pytest.approx(1.0)
    assert set(result.matched_symptoms) == set(sample_disease.symptoms)
    assert result.missing_symptoms == []


def test_partial_match(service: ConfidenceScoringService, sample_disease: Disease) -> None:
    user_symptoms = ["fever", "hot udder to touch"]

    result = service.score_disease(user_symptoms, sample_disease)

    assert result.confidence_score == pytest.approx(0.5)
    assert result.matched_symptoms == ["hot udder to touch", "fever"]
    assert result.missing_symptoms == [
        "swollen painful udder quarter",
        "reduced milk yield",
    ]


def test_zero_match(service: ConfidenceScoringService, sample_disease: Disease) -> None:
    user_symptoms = ["lameness", "nasal discharge"]

    result = service.score_disease(user_symptoms, sample_disease)

    assert result.confidence_score == pytest.approx(0.0)
    assert result.matched_symptoms == []
    assert result.missing_symptoms == sample_disease.symptoms


def test_duplicate_user_symptoms_do_not_inflate_score(
    service: ConfidenceScoringService,
    sample_disease: Disease,
) -> None:
    user_symptoms = ["fever", "FEVER", "  fever  "]

    result = service.score_disease(user_symptoms, sample_disease)

    assert result.confidence_score == pytest.approx(0.25)
    assert result.matched_symptoms == ["fever"]
    assert len(result.missing_symptoms) == 3


def test_case_insensitive_matching(
    service: ConfidenceScoringService,
    sample_disease: Disease,
) -> None:
    user_symptoms = ["FEVER", "Hot Udder To Touch"]

    result = service.score_disease(user_symptoms, sample_disease)

    assert result.confidence_score == pytest.approx(0.5)
    assert "fever" in result.matched_symptoms
    assert "hot udder to touch" in result.matched_symptoms


def test_score_multiple_diseases_sorted_by_confidence(
    service: ConfidenceScoringService,
) -> None:
    mastitis = Disease(
        disease_id="mastitis",
        disease_name="Mastitis",
        animal_type=AnimalType.CATTLE,
        description="Udder inflammation.",
        symptoms=["fever", "swollen udder"],
        severity_level=DiseaseSeverityLevel.MEDIUM,
    )
    anthrax = Disease(
        disease_id="anthrax",
        disease_name="Anthrax",
        animal_type=AnimalType.CATTLE,
        description="Acute bacterial disease.",
        symptoms=["sudden death", "high fever", "bloody discharge"],
        severity_level=DiseaseSeverityLevel.CRITICAL,
    )
    user_symptoms = ["fever", "swollen udder"]

    results = service.score_multiple_diseases(user_symptoms, [anthrax, mastitis])

    assert [match.disease_id for match in results] == ["mastitis", "anthrax"]
    assert results[0].confidence_score == pytest.approx(1.0)
    assert results[1].confidence_score == pytest.approx(0.0)


def test_disease_match_metadata(
    service: ConfidenceScoringService,
    sample_disease: Disease,
) -> None:
    result = service.score_disease(["fever"], sample_disease)

    assert result.disease_id == sample_disease.disease_id
    assert result.disease_name == sample_disease.disease_name


def test_empty_user_symptoms(service: ConfidenceScoringService, sample_disease: Disease) -> None:
    result = service.score_disease([], sample_disease)

    assert result.confidence_score == pytest.approx(0.0)
    assert result.matched_symptoms == []
    assert len(result.missing_symptoms) == len(sample_disease.symptoms)
