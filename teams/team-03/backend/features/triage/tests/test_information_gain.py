"""Tests for information-gain question ranking."""

from __future__ import annotations

from pathlib import Path

import pytest

from features.rag.repositories.disease_repository import DiseaseRepository
from features.rag.schemas.disease import DiseaseMatch
from features.triage.services.information_gain import information_gain_for_symptom


@pytest.fixture
def repository() -> DiseaseRepository:
    repo = DiseaseRepository(datasets_dir=Path(__file__).resolve().parents[3] / "datasets")
    repo.load()
    return repo


def test_mouth_blisters_gain_higher_than_generic_fever(repository: DiseaseRepository) -> None:
    matches = [
        DiseaseMatch(
            disease_id="foot-and-mouth-disease",
            disease_name="Foot and Mouth Disease",
            confidence_score=0.45,
            matched_symptoms=["high fever"],
            missing_symptoms=["mouth_blisters", "drooling"],
        ),
        DiseaseMatch(
            disease_id="anthrax",
            disease_name="Anthrax",
            confidence_score=0.40,
            matched_symptoms=["high fever"],
            missing_symptoms=["bloody_discharge"],
        ),
    ]
    mouth_gain = information_gain_for_symptom(
        symptom_id="mouth_blisters",
        candidate_matches=matches,
        repository=repository,
    )
    fever_gain = information_gain_for_symptom(
        symptom_id="fever",
        candidate_matches=matches,
        repository=repository,
    )
    assert mouth_gain > fever_gain
