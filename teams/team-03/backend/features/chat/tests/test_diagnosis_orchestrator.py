"""Unit tests for DiagnosisOrchestrator."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.chat.services.diagnosis_orchestrator import DiagnosisOrchestrator
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel, TriageSeverity
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.services.disease_retrieval_service import DiseaseRetrievalService


def _disease(
    disease_id: str,
    disease_name: str,
    symptoms: list[str],
) -> Disease:
    return Disease(
        disease_id=disease_id,
        disease_name=disease_name,
        animal_type=AnimalType.CATTLE,
        description=f"Description for {disease_name}.",
        symptoms=symptoms,
        severity_level=DiseaseSeverityLevel.MEDIUM,
    )


def _write_disease_file(directory: Path, disease: Disease) -> None:
    path = directory / f"{disease.disease_id}.json"
    path.write_text(json.dumps(disease.model_dump(mode="json")), encoding="utf-8")


@pytest.fixture
def fmd() -> Disease:
    return _disease(
        "fmd",
        "Foot and Mouth Disease",
        ["fever", "drooling", "mouth ulcers"],
    )


@pytest.fixture
def lsd() -> Disease:
    return _disease(
        "lsd",
        "Lumpy Skin Disease",
        ["fever", "skin nodules", "loss of appetite"],
    )


@pytest.fixture
def mastitis() -> Disease:
    return _disease(
        "mastitis",
        "Mastitis",
        [
            "swollen painful udder quarter",
            "hot udder to touch",
            "fever",
            "reduced milk yield",
        ],
    )


@pytest.fixture
def diseases_dir(tmp_path: Path, fmd: Disease, lsd: Disease, mastitis: Disease) -> Path:
    for disease in (fmd, lsd, mastitis):
        _write_disease_file(tmp_path, disease)
    return tmp_path


@pytest.fixture
def orchestrator(diseases_dir: Path) -> DiagnosisOrchestrator:
    document_service = DiseaseDocumentService(documents_dir=diseases_dir)
    retrieval_service = DiseaseRetrievalService(document_service=document_service)
    return DiagnosisOrchestrator(
        retrieval_service=retrieval_service,
        document_service=document_service,
    )


def test_disease_found_returns_candidates_without_sms_during_gathering(
    orchestrator: DiagnosisOrchestrator,
    mastitis: Disease,
) -> None:
    response = orchestrator.diagnose(
        animal_type="cattle",
        symptoms=["swollen painful udder quarter"],
    )

    assert len(response.candidate_diseases) >= 1
    assert response.candidate_diseases[0].disease_id == mastitis.disease_id
    assert response.sms_alert is None
    assert len(response.followup_questions) > 0
    assert response.requires_more_information is True
    assert response.triage_result.severity == TriageSeverity.URGENT


def test_two_strong_symptoms_skip_followup_questions(
    orchestrator: DiagnosisOrchestrator,
    mastitis: Disease,
) -> None:
    response = orchestrator.diagnose(
        animal_type="cattle",
        symptoms=["swollen painful udder quarter", "fever"],
    )

    assert response.candidate_diseases[0].disease_id == mastitis.disease_id
    assert response.followup_questions == []
    assert response.requires_more_information is False


def test_disease_not_found_returns_empty_candidates(
    orchestrator: DiagnosisOrchestrator,
) -> None:
    response = orchestrator.diagnose(
        animal_type="cattle",
        symptoms=["completely unrelated symptom", "unknown sign"],
    )

    assert response.candidate_diseases == []
    assert response.sms_alert is None
    assert response.followup_questions == []
    assert response.requires_more_information is False
    assert response.triage_result.severity == TriageSeverity.SELF_TREATABLE


def test_ambiguous_diagnosis_requires_more_information(
    orchestrator: DiagnosisOrchestrator,
) -> None:
    response = orchestrator.diagnose(
        animal_type="cattle",
        symptoms=["fever"],
    )

    assert len(response.candidate_diseases) >= 2
    assert len(response.followup_questions) > 0
    assert response.requires_more_information is True


def test_clear_diagnosis_does_not_require_more_information(
    orchestrator: DiagnosisOrchestrator,
    mastitis: Disease,
) -> None:
    response = orchestrator.diagnose(
        animal_type="cattle",
        symptoms=[
            "swollen painful udder quarter",
            "hot udder to touch",
            "fever",
            "reduced milk yield",
        ],
    )

    assert response.candidate_diseases[0].disease_id == mastitis.disease_id
    assert response.candidate_diseases[0].confidence_score == pytest.approx(1.0)
    assert response.followup_questions == []
    assert response.requires_more_information is False
    assert response.sms_alert is None


def test_critical_severity_always_returned(
    orchestrator: DiagnosisOrchestrator,
) -> None:
    response = orchestrator.diagnose(
        animal_type="buffalo",
        symptoms=["difficulty breathing", "fever"],
    )

    assert response.triage_result.severity == TriageSeverity.CRITICAL
    assert "difficulty breathing" in response.triage_result.reason.lower()
    if response.sms_alert is not None:
        assert response.sms_alert.severity == TriageSeverity.CRITICAL
        assert "CRITICAL VETERINARY ALERT" in response.sms_alert.message


def test_triage_result_always_present_even_without_candidates(
    orchestrator: DiagnosisOrchestrator,
) -> None:
    response = orchestrator.diagnose(animal_type="goat", symptoms=[])

    assert response.triage_result is not None
    assert response.triage_result.severity == TriageSeverity.SELF_TREATABLE
