"""Unit tests for DiseaseRetrievalService."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from features.confidence_scoring.services.confidence_service import ConfidenceScoringService
from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.services.disease_retrieval_service import (
    DiseaseRetrievalService,
    SymptomOverlapDiseaseRetriever,
)


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
    payload = disease.model_dump(mode="json")
    path = directory / f"{disease.disease_id}.json"
    path.write_text(json.dumps(payload), encoding="utf-8")


@pytest.fixture
def fmd() -> Disease:
    return _disease(
        "fmd",
        "Foot and Mouth Disease",
        ["high fever", "blisters on tongue and gums", "drooling"],
    )


@pytest.fixture
def mastitis() -> Disease:
    return _disease(
        "mastitis",
        "Mastitis",
        ["swollen painful udder quarter", "fever", "reduced milk yield"],
    )


@pytest.fixture
def anthrax() -> Disease:
    return _disease(
        "anthrax",
        "Anthrax",
        ["sudden death without warning", "high fever", "bloody discharge"],
    )


@pytest.fixture
def diseases_dir(tmp_path: Path, fmd: Disease, mastitis: Disease, anthrax: Disease) -> Path:
    for disease in (fmd, mastitis, anthrax):
        _write_disease_file(tmp_path, disease)
    return tmp_path


@pytest.fixture
def retrieval_service(diseases_dir: Path) -> DiseaseRetrievalService:
    document_service = DiseaseDocumentService(documents_dir=diseases_dir)
    return DiseaseRetrievalService(
        document_service=document_service,
        scoring_service=ConfidenceScoringService(),
    )


def test_single_matching_disease(
    retrieval_service: DiseaseRetrievalService,
    mastitis: Disease,
) -> None:
    results = retrieval_service.retrieve_candidates(
        ["swollen painful udder quarter", "fever"],
        top_k=5,
    )

    assert len(results) == 1
    assert results[0].disease_id == mastitis.disease_id
    assert results[0].confidence_score == pytest.approx(2 / 3)


def test_multiple_matching_diseases_sorted_by_confidence(
    retrieval_service: DiseaseRetrievalService,
    fmd: Disease,
    anthrax: Disease,
) -> None:
    results = retrieval_service.retrieve_candidates(
        ["high fever", "blisters on tongue and gums"],
        top_k=5,
    )

    assert len(results) == 2
    assert results[0].disease_id == fmd.disease_id
    assert results[0].confidence_score == pytest.approx(2 / 3)
    assert results[1].disease_id == anthrax.disease_id
    assert results[0].confidence_score > results[1].confidence_score


def test_no_matches_returns_empty_list(retrieval_service: DiseaseRetrievalService) -> None:
    results = retrieval_service.retrieve_candidates(
        ["unrelated symptom", "another unknown sign"],
        top_k=5,
    )

    assert results == []


def test_top_k_filtering(
    retrieval_service: DiseaseRetrievalService,
    fmd: Disease,
) -> None:
    results = retrieval_service.retrieve_candidates(
        ["high fever", "blisters on tongue and gums"],
        top_k=1,
    )

    assert len(results) == 1
    assert results[0].disease_id == fmd.disease_id


def test_zero_confidence_matches_are_excluded(
    diseases_dir: Path,
    fmd: Disease,
    mastitis: Disease,
) -> None:
    lsd = _disease("lsd", "Lumpy Skin Disease", ["skin nodules", "loss of appetite"])
    _write_disease_file(diseases_dir, lsd)

    service = DiseaseRetrievalService(
        document_service=DiseaseDocumentService(documents_dir=diseases_dir),
        scoring_service=ConfidenceScoringService(),
    )
    results = service.retrieve_candidates(["high fever"], top_k=5)

    assert all(match.confidence_score > 0.0 for match in results)
    assert all(match.disease_id != lsd.disease_id for match in results)
    assert results[0].disease_id == fmd.disease_id


def test_sorting_order_is_descending_confidence(
    retrieval_service: DiseaseRetrievalService,
) -> None:
    results = retrieval_service.retrieve_candidates(
        ["high fever", "blisters on tongue and gums"],
        top_k=5,
    )

    scores = [match.confidence_score for match in results]
    assert scores == sorted(scores, reverse=True)


def test_top_k_zero_returns_empty_list(retrieval_service: DiseaseRetrievalService) -> None:
    assert retrieval_service.retrieve_candidates(["fever"], top_k=0) == []


def test_custom_retriever_can_be_injected_without_changing_callers() -> None:
    mock_retriever = MagicMock()
    mock_retriever.retrieve_candidates.return_value = [
        DiseaseMatch(
            disease_id="custom",
            disease_name="Custom Disease",
            confidence_score=0.9,
            matched_symptoms=["fever"],
            missing_symptoms=[],
        )
    ]
    document_service = MagicMock()
    document_service.load_all.return_value = [
        _disease("custom", "Custom Disease", ["fever"]),
    ]

    service = DiseaseRetrievalService(
        document_service=document_service,
        retriever=mock_retriever,
    )
    results = service.retrieve_candidates(["fever"], top_k=3)

    document_service.load_all.assert_called_once()
    mock_retriever.retrieve_candidates.assert_called_once()
    assert results[0].disease_id == "custom"


def test_symptom_overlap_retriever_delegates_to_scoring_service() -> None:
    diseases = [
        _disease("a", "Disease A", ["fever", "cough"]),
        _disease("b", "Disease B", ["fever"]),
    ]
    scoring = ConfidenceScoringService()
    retriever = SymptomOverlapDiseaseRetriever(scoring)

    results = retriever.retrieve_candidates(["fever"], diseases, top_k=5)

    assert len(results) == 2
    assert results[0].confidence_score == pytest.approx(1.0)
    assert results[0].disease_id == "b"
