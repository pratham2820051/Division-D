"""Unit tests for DiagnosticQuestionService."""

import pytest

from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.triage.services.diagnostic_question_service import DiagnosticQuestionService


@pytest.fixture
def service() -> DiagnosticQuestionService:
    return DiagnosticQuestionService()


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
        severity_level=DiseaseSeverityLevel.HIGH,
    )


def _match(
    disease: Disease,
    confidence_score: float,
    *,
    matched_symptoms: list[str] | None = None,
    missing_symptoms: list[str] | None = None,
) -> DiseaseMatch:
    matched = matched_symptoms if matched_symptoms is not None else ["fever"]
    missing = (
        missing_symptoms
        if missing_symptoms is not None
        else [s for s in disease.symptoms if s not in matched]
    )
    return DiseaseMatch(
        disease_id=disease.disease_id,
        disease_name=disease.disease_name,
        confidence_score=confidence_score,
        matched_symptoms=matched,
        missing_symptoms=missing,
    )


@pytest.fixture
def foot_and_mouth() -> Disease:
    return _disease(
        "fmd",
        "Foot and Mouth Disease",
        ["fever", "drooling", "mouth ulcers"],
    )


@pytest.fixture
def lumpy_skin() -> Disease:
    return _disease(
        "lsd",
        "Lumpy Skin Disease",
        ["fever", "skin nodules", "loss of appetite"],
    )


def test_is_ambiguous_when_top_two_within_threshold(
    service: DiagnosticQuestionService,
    foot_and_mouth: Disease,
    lumpy_skin: Disease,
) -> None:
    matches = [
        _match(foot_and_mouth, 0.55),
        _match(lumpy_skin, 0.50),
    ]

    assert service.is_ambiguous(matches) is True


def test_not_ambiguous_when_confidence_gap_is_large(
    service: DiagnosticQuestionService,
    foot_and_mouth: Disease,
    lumpy_skin: Disease,
) -> None:
    matches = [
        _match(foot_and_mouth, 0.90),
        _match(lumpy_skin, 0.40),
    ]

    assert service.is_ambiguous(matches) is False
    assert service.generate_followup_questions(matches, [foot_and_mouth, lumpy_skin]) == []


def test_generate_questions_for_ambiguous_diseases(
    service: DiagnosticQuestionService,
    foot_and_mouth: Disease,
    lumpy_skin: Disease,
) -> None:
    foot_and_mouth.disease_id = "foot-and-mouth-disease"
    foot_and_mouth.symptoms = [
        "high fever",
        "blisters on tongue and gums",
        "excessive salivation and drooling",
    ]
    lumpy_skin.disease_id = "lumpy-skin-disease"
    lumpy_skin.symptoms = [
        "high fever",
        "firm skin nodules on neck and body",
        "loss of appetite",
    ]

    matches = [
        _match(
            foot_and_mouth,
            0.34,
            matched_symptoms=["high fever"],
            missing_symptoms=[
                "blisters on tongue and gums",
                "excessive salivation and drooling",
            ],
        ),
        _match(
            lumpy_skin,
            0.34,
            matched_symptoms=["high fever"],
            missing_symptoms=[
                "firm skin nodules on neck and body",
                "loss of appetite",
            ],
        ),
    ]

    questions = service.generate_followup_questions(
        matches,
        [foot_and_mouth, lumpy_skin],
    )

    assert len(questions) == 1
    assert "blister" in questions[0].question.lower()
    assert questions[0].disease_candidates == ["Foot and Mouth Disease"]


def test_skips_already_reported_symptoms(
    service: DiagnosticQuestionService,
    foot_and_mouth: Disease,
    lumpy_skin: Disease,
) -> None:
    foot_and_mouth.disease_id = "foot-and-mouth-disease"
    foot_and_mouth.symptoms = [
        "high fever",
        "blisters on tongue and gums",
        "excessive salivation and drooling",
    ]
    lumpy_skin.disease_id = "lumpy-skin-disease"
    lumpy_skin.symptoms = [
        "high fever",
        "firm skin nodules on neck and body",
        "loss of appetite",
    ]

    matches = [
        _match(
            foot_and_mouth,
            0.50,
            matched_symptoms=["high fever", "excessive salivation and drooling"],
            missing_symptoms=["blisters on tongue and gums"],
        ),
        _match(
            lumpy_skin,
            0.45,
            matched_symptoms=["high fever"],
            missing_symptoms=["firm skin nodules on neck and body", "loss of appetite"],
        ),
    ]

    questions = service.generate_followup_questions(
        matches,
        [foot_and_mouth, lumpy_skin],
    )

    assert [question.symptom for question in questions] == [
        "blisters on tongue and gums",
    ]


def test_no_questions_when_symptom_profiles_are_identical(
    service: DiagnosticQuestionService,
) -> None:
    disease_a = _disease("a", "Disease A", ["fever", "cough"])
    disease_b = _disease("b", "Disease B", ["fever", "cough"])
    matches = [
        _match(disease_a, 0.50, matched_symptoms=[], missing_symptoms=["fever", "cough"]),
        _match(disease_b, 0.48, matched_symptoms=[], missing_symptoms=["fever", "cough"]),
    ]

    questions = service.generate_followup_questions(matches, [disease_a, disease_b])

    assert questions == []


def test_multiple_diseases_in_ambiguous_group(
    service: DiagnosticQuestionService,
) -> None:
    disease_a = _disease("a", "Disease A", ["fever", "drooling"])
    disease_b = _disease("b", "Disease B", ["fever", "skin nodules"])
    disease_c = _disease("c", "Disease C", ["fever", "lameness"])
    matches = [
        _match(disease_a, 0.60, matched_symptoms=["fever"], missing_symptoms=["drooling"]),
        _match(disease_b, 0.55, matched_symptoms=["fever"], missing_symptoms=["skin nodules"]),
        _match(disease_c, 0.50, matched_symptoms=["fever"], missing_symptoms=["lameness"]),
    ]

    questions = service.generate_followup_questions(
        matches,
        [disease_a, disease_b, disease_c],
    )

    assert len(questions) == 1
    assert questions[0].disease_candidates == ["Disease A"]


def test_case_insensitive_common_symptom_detection(
    service: DiagnosticQuestionService,
) -> None:
    disease_a = _disease("a", "Disease A", ["Fever", "drooling"])
    disease_b = _disease("b", "Disease B", ["fever", "skin nodules"])
    matches = [
        _match(disease_a, 0.50, matched_symptoms=["Fever"], missing_symptoms=["drooling"]),
        _match(disease_b, 0.48, matched_symptoms=["fever"], missing_symptoms=["skin nodules"]),
    ]

    questions = service.generate_followup_questions(matches, [disease_a, disease_b])

    assert "Fever" not in [question.symptom for question in questions]
    assert len(questions) == 1
    assert questions[0].symptom in {"drooling", "skin nodules"}


def test_max_one_question_per_turn(
    service: DiagnosticQuestionService,
) -> None:
    disease_a = _disease("a", "Disease A", ["fever", "s1", "s2", "s3", "s4"])
    disease_b = _disease("b", "Disease B", ["fever", "s5", "s6", "s7", "s8"])
    matches = [
        _match(disease_a, 0.50, matched_symptoms=["fever"], missing_symptoms=["s1", "s2", "s3", "s4"]),
        _match(disease_b, 0.49, matched_symptoms=["fever"], missing_symptoms=["s5", "s6", "s7", "s8"]),
    ]

    questions = service.generate_followup_questions(matches, [disease_a, disease_b])

    assert len(questions) == 1


def test_single_match_returns_no_questions(service: DiagnosticQuestionService, foot_and_mouth: Disease) -> None:
    matches = [_match(foot_and_mouth, 0.80)]

    assert service.generate_followup_questions(matches, [foot_and_mouth]) == []


def test_missing_disease_record_skipped_gracefully(
    service: DiagnosticQuestionService,
    foot_and_mouth: Disease,
    lumpy_skin: Disease,
) -> None:
    matches = [
        _match(foot_and_mouth, 0.50, matched_symptoms=["fever"], missing_symptoms=["drooling", "mouth ulcers"]),
        _match(lumpy_skin, 0.48, matched_symptoms=["fever"], missing_symptoms=["skin nodules", "loss of appetite"]),
    ]

    questions = service.generate_followup_questions(matches, [foot_and_mouth])

    assert len(questions) == 1
    assert questions[0].symptom == "drooling"
