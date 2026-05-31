"""Tests for dataset-driven DiseaseRepository."""

from __future__ import annotations

from pathlib import Path

import pytest

from features.confidence_scoring.services.confidence_service import ConfidenceScoringService
from features.rag.repositories.disease_repository import DiseaseRepository, reset_default_repository
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.services.disease_retrieval_service import DiseaseRetrievalService
from features.triage.services.diagnostic_question_service import DiagnosticQuestionService
from features.triage.services.triage_service import TriageService

BACKEND_ROOT = Path(__file__).resolve().parents[3]
DATASETS_DIR = BACKEND_ROOT / "datasets"


@pytest.fixture(autouse=True)
def _reset_repo_cache() -> None:
    reset_default_repository()
    yield
    reset_default_repository()


@pytest.fixture
def repository() -> DiseaseRepository:
    repo = DiseaseRepository(datasets_dir=DATASETS_DIR)
    repo.load()
    return repo


def test_repository_loads_five_diseases(repository: DiseaseRepository) -> None:
    diseases = repository.get_disease_records()
    assert len(diseases) == 5
    assert {disease.disease_id for disease in diseases} == {
        "anthrax",
        "foot-and-mouth-disease",
        "lumpy-skin-disease",
        "mastitis",
        "brucellosis",
    }


def test_repository_filters_by_animal_type(repository: DiseaseRepository) -> None:
    goat_diseases = repository.get_disease_records("goat")
    assert all("goat" in disease.animal_types for disease in goat_diseases)
    assert len(goat_diseases) >= 2


def test_weighted_scoring_uses_dataset_weights(repository: DiseaseRepository) -> None:
    scoring = ConfidenceScoringService(repository=repository)
    diseases = repository.to_disease_models("cattle")
    mastitis = next(disease for disease in diseases if disease.disease_id == "mastitis")

    result = scoring.score_disease(["fever", "hot udder to touch"], mastitis)

    assert result.confidence_score == pytest.approx(2.0 / 6.8, rel=1e-2)
    assert "fever" in result.matched_symptoms


def test_followup_questions_loaded_from_dataset(repository: DiseaseRepository) -> None:
    service = DiagnosticQuestionService(repository=repository)
    questions = repository.get_followup_questions("foot-and-mouth-disease")
    assert len(questions) >= 3
    assert any("blister" in question.lower() for _, question in questions)


def test_triage_uses_symptom_triage_tier(repository: DiseaseRepository) -> None:
    service = TriageService(repository=repository)
    result = service.classify(["sudden death without warning"])
    assert result.severity.value == "critical"


def test_document_service_defaults_to_repository(repository: DiseaseRepository) -> None:
    service = DiseaseDocumentService(repository=repository)
    diseases = service.load_all(animal_type="cattle")
    assert len(diseases) == 5


def test_retrieval_filters_zero_confidence_for_wrong_species(
    repository: DiseaseRepository,
) -> None:
    document_service = DiseaseDocumentService(repository=repository)
    retrieval = DiseaseRetrievalService(document_service=document_service)
    matches = retrieval.retrieve_candidates(
        ["fever"],
        top_k=5,
        animal_type="goat",
    )
    assert matches
    assert all(match.confidence_score > 0 for match in matches)


def test_multilingual_symptom_alias_resolution(repository: DiseaseRepository) -> None:
    assert repository.resolve_symptom_id("bukhar") == "fever"
    assert repository.resolve_symptom_id("ಜ್ವರ") == "fever"


def test_multilingual_animal_alias_resolution(repository: DiseaseRepository) -> None:
    assert repository.resolve_animal_id("meke") == "goat"
    assert repository.resolve_animal_id("गाय") == "cattle"
