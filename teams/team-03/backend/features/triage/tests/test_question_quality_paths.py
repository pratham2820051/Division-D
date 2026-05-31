"""Disease-specific diagnostic question quality tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.rag.schemas.disease import DiseaseMatch
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.triage.services.diagnostic_question_service import DiagnosticQuestionService


@pytest.fixture
def diseases():
    document_service = DiseaseDocumentService()
    return document_service.load_all()


@pytest.fixture
def service() -> DiagnosticQuestionService:
    return DiagnosticQuestionService()


def _match(disease, confidence: float, matched: list[str]) -> DiseaseMatch:
    missing = [s for s in disease.symptoms if s not in matched]
    return DiseaseMatch(
        disease_id=disease.disease_id,
        disease_name=disease.disease_name,
        confidence_score=confidence,
        matched_symptoms=matched,
        missing_symptoms=missing,
    )


def _disease_by_id(diseases, disease_id: str):
    for disease in diseases:
        if disease.disease_id == disease_id:
            return disease
    raise KeyError(disease_id)


def test_anthrax_path_asks_bloody_discharge(service, diseases) -> None:
    anthrax = _disease_by_id(diseases, "anthrax")
    matches = [_match(anthrax, 0.35, ["high fever"])]

    questions = service.generate_followup_questions(matches, diseases)

    assert questions
    assert any(
        "bloody discharge" in q.question.lower()
        for q in questions
    )
    assert questions[0].disease_candidates == ["Anthrax"]


def test_fmd_path_asks_mouth_or_hoof_blisters(service, diseases) -> None:
    fmd = _disease_by_id(diseases, "foot-and-mouth-disease")
    matches = [_match(fmd, 0.35, ["high fever"])]

    questions = service.generate_followup_questions(matches, diseases)

    assert questions
    assert any("blister" in q.question.lower() for q in questions)
    assert questions[0].disease_candidates == ["Foot and Mouth Disease"]


def test_mastitis_path_asks_udder_or_milk(service, diseases) -> None:
    mastitis = _disease_by_id(diseases, "mastitis")
    matches = [_match(mastitis, 0.35, ["fever"])]

    questions = service.generate_followup_questions(matches, diseases)

    assert questions
    assert any(
        "udder" in q.question.lower() or "milk" in q.question.lower()
        for q in questions
    )
    assert questions[0].disease_candidates == ["Mastitis"]


def test_lumpy_skin_disease_path_asks_nodules(service, diseases) -> None:
    lsd = _disease_by_id(diseases, "lumpy-skin-disease")
    matches = [_match(lsd, 0.35, ["high fever"])]

    questions = service.generate_followup_questions(matches, diseases)

    assert questions
    assert any("nodule" in q.question.lower() or "lump" in q.question.lower() for q in questions)
    assert questions[0].disease_candidates == ["Lumpy Skin Disease"]


def test_ambiguous_fever_questions_differ_by_disease(service, diseases) -> None:
    anthrax = _disease_by_id(diseases, "anthrax")
    fmd = _disease_by_id(diseases, "foot-and-mouth-disease")
    lsd = _disease_by_id(diseases, "lumpy-skin-disease")

    anthrax_q = service.generate_followup_questions(
        [_match(anthrax, 0.20, ["high fever"])],
        diseases,
    )
    fmd_q = service.generate_followup_questions(
        [_match(fmd, 0.20, ["high fever"])],
        diseases,
    )
    lsd_q = service.generate_followup_questions(
        [_match(lsd, 0.20, ["high fever"])],
        diseases,
    )

    assert len(anthrax_q) == 1
    assert len(fmd_q) == 1
    assert len(lsd_q) == 1
    question_texts = {anthrax_q[0].question, fmd_q[0].question, lsd_q[0].question}
    assert len(question_texts) == 3


def test_brucellosis_path_asks_reproductive_symptoms(service, diseases) -> None:
    brucellosis = _disease_by_id(diseases, "brucellosis")
    matches = [_match(brucellosis, 0.35, ["intermittent fever"])]

    questions = service.generate_followup_questions(matches, diseases)

    assert questions
    assert any(
        "abortion" in q.question.lower() or "placenta" in q.question.lower()
        for q in questions
    )
    assert questions[0].disease_candidates == ["Brucellosis"]


def test_questions_never_exceed_one_per_turn(service, diseases) -> None:
    anthrax = _disease_by_id(diseases, "anthrax")
    fmd = _disease_by_id(diseases, "foot-and-mouth-disease")
    mastitis = _disease_by_id(diseases, "mastitis")
    lsd = _disease_by_id(diseases, "lumpy-skin-disease")

    matches = [
        _match(anthrax, 0.20, ["high fever"]),
        _match(fmd, 0.19, ["high fever"]),
        _match(mastitis, 0.18, ["fever"]),
        _match(lsd, 0.17, ["high fever"]),
    ]

    questions = service.generate_followup_questions(matches, diseases)

    assert len(questions) <= 1
