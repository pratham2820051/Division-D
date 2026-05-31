"""Unit tests for symptom extraction."""

from unittest.mock import MagicMock

import pytest

from features.chat.schemas.symptom_extraction import SymptomExtractionResult
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.rag.schemas.enums import AnimalType


@pytest.fixture
def extractor() -> RuleBasedSymptomExtractor:
    return RuleBasedSymptomExtractor()


@pytest.fixture
def service(extractor: RuleBasedSymptomExtractor) -> SymptomExtractionService:
    return SymptomExtractionService(extractor=extractor)


def test_example_high_fever_and_drooling(service: SymptomExtractionService) -> None:
    result = service.extract("My cow has high fever and is drooling.")

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == ["high fever", "drooling"]


def test_example_not_eating_and_mouth_blisters(service: SymptomExtractionService) -> None:
    result = service.extract("The cow is not eating and has blisters in its mouth.")

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == ["reduced appetite", "blisters on tongue and gums"]


def test_fever_extraction(service: SymptomExtractionService) -> None:
    result = service.extract("The buffalo has fever and looks weak.")

    assert result.animal_type == AnimalType.BUFFALO
    assert "fever" in result.symptoms
    assert "high fever" not in result.symptoms


def test_high_fever_extraction(service: SymptomExtractionService) -> None:
    result = service.extract("Goat with high fever")

    assert result.animal_type == AnimalType.GOAT
    assert result.symptoms == ["high fever"]


def test_drooling_extraction(service: SymptomExtractionService) -> None:
    result = service.extract("Cattle drooling excessively")

    assert result.animal_type == AnimalType.CATTLE
    assert "drooling" in result.symptoms


def test_appetite_extraction(service: SymptomExtractionService) -> None:
    result = service.extract("Sheep is off feed since yesterday")

    assert result.animal_type == AnimalType.SHEEP
    assert result.symptoms == ["reduced appetite"]


def test_multiple_symptoms(service: SymptomExtractionService) -> None:
    result = service.extract(
        "Cow has high fever, swollen udder, and is not eating."
    )

    assert result.animal_type == AnimalType.CATTLE
    assert "high fever" in result.symptoms
    assert "swollen painful udder quarter" in result.symptoms
    assert "reduced appetite" in result.symptoms


def test_no_symptoms_found_returns_empty_list(service: SymptomExtractionService) -> None:
    result = service.extract("My cow is standing normally in the field.")

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == []


def test_case_insensitive_matching(service: SymptomExtractionService) -> None:
    result = service.extract("COW has HIGH FEVER and is DROOLING")

    assert result.symptoms == ["high fever", "drooling"]


def test_custom_extractor_can_be_injected() -> None:
    mock_extractor = MagicMock()
    mock_extractor.extract.return_value = SymptomExtractionResult(
        animal_type=AnimalType.PIG,
        symptoms=["fever"],
    )
    service = SymptomExtractionService(extractor=mock_extractor)

    result = service.extract("any message")

    assert result.animal_type == AnimalType.PIG
    mock_extractor.extract.assert_called_once_with("any message")
