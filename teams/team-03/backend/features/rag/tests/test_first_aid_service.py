"""Unit tests for FirstAidService."""

import pytest

from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.first_aid_service import FirstAidService


@pytest.fixture
def service() -> FirstAidService:
    return FirstAidService()


def _disease(
    disease_id: str,
    disease_name: str,
    first_aid: list[str],
) -> Disease:
    return Disease(
        disease_id=disease_id,
        disease_name=disease_name,
        animal_type=AnimalType.CATTLE,
        description="Test disease description.",
        symptoms=["fever"],
        first_aid=first_aid,
        severity_level=DiseaseSeverityLevel.MEDIUM,
    )


def _match(disease: Disease, confidence_score: float = 0.82) -> DiseaseMatch:
    return DiseaseMatch(
        disease_id=disease.disease_id,
        disease_name=disease.disease_name,
        confidence_score=confidence_score,
        matched_symptoms=["fever"],
        missing_symptoms=[],
    )


def test_disease_found_returns_first_aid_steps(service: FirstAidService) -> None:
    disease = _disease(
        "fmd",
        "Foot and Mouth Disease",
        [
            "Isolate the affected animal immediately.",
            "Notify the nearest veterinary officer.",
        ],
    )
    match = _match(disease, confidence_score=0.82)

    result = service.get_first_aid(match, [disease])

    assert result.disease_name == "Foot and Mouth Disease"
    assert result.confidence_score == pytest.approx(0.82)
    assert result.first_aid == disease.first_aid


def test_disease_not_found_returns_empty_first_aid(service: FirstAidService) -> None:
    disease = _disease("mastitis", "Mastitis", ["Call a veterinarian."])
    match = DiseaseMatch(
        disease_id="unknown-disease",
        disease_name="Unknown Disease",
        confidence_score=0.4,
        matched_symptoms=[],
        missing_symptoms=[],
    )

    result = service.get_first_aid(match, [disease])

    assert result.disease_name == "Unknown Disease"
    assert result.confidence_score == pytest.approx(0.4)
    assert result.first_aid == []


def test_empty_disease_list_returns_empty_first_aid(service: FirstAidService) -> None:
    match = DiseaseMatch(
        disease_id="fmd",
        disease_name="Foot and Mouth Disease",
        confidence_score=0.9,
        matched_symptoms=["fever"],
        missing_symptoms=[],
    )

    result = service.get_first_aid(match, [])

    assert result.first_aid == []
    assert result.confidence_score == pytest.approx(0.9)


def test_confidence_score_preserved_from_match(service: FirstAidService) -> None:
    disease = _disease("anthrax", "Anthrax", ["Do not open the carcass."])
    match = _match(disease, confidence_score=0.673)

    result = service.get_first_aid(match, [disease])

    assert result.confidence_score == pytest.approx(0.673)


def test_lookup_uses_disease_id_not_name(service: FirstAidService) -> None:
    disease = _disease("mastitis", "Mastitis", ["Strip affected quarters gently."])
    match = DiseaseMatch(
        disease_id="mastitis",
        disease_name="Different Display Name",
        confidence_score=0.7,
        matched_symptoms=["fever"],
        missing_symptoms=[],
    )

    result = service.get_first_aid(match, [disease])

    assert result.first_aid == ["Strip affected quarters gently."]
    assert result.disease_name == "Different Display Name"


def test_disease_with_no_first_aid_steps_returns_empty_list(service: FirstAidService) -> None:
    disease = _disease("minimal", "Minimal Disease", [])
    match = _match(disease)

    result = service.get_first_aid(match, [disease])

    assert result.first_aid == []
