"""Unit tests for TriageService."""

import pytest

from features.rag.schemas.enums import TriageSeverity
from features.triage.services.triage_service import TriageService


@pytest.fixture
def service() -> TriageService:
    return TriageService()


@pytest.mark.parametrize(
    "symptom",
    [
        "difficulty breathing",
        "unable to stand",
        "sudden death without warning",
        "bloody discharge from natural openings",
        "seizures",
        "collapse",
    ],
)
def test_critical_classification_for_each_catalog_symptom(
    service: TriageService,
    symptom: str,
) -> None:
    result = service.classify([symptom])

    assert result.severity == TriageSeverity.CRITICAL
    assert result.reason == f"Detected symptom: {symptom}"


@pytest.mark.parametrize(
    "symptom",
    [
        "high fever",
        "blisters on tongue and gums",
        "blisters on hooves and between digits",
        "firm skin nodules on neck and body",
        "abortion in late pregnancy",
        "swollen painful udder quarter",
    ],
)
def test_urgent_classification_for_each_catalog_symptom(
    service: TriageService,
    symptom: str,
) -> None:
    result = service.classify([symptom])

    assert result.severity == TriageSeverity.URGENT
    assert result.reason == f"Detected symptom: {symptom}"


def test_self_treatable_when_no_rule_symptoms_match(service: TriageService) -> None:
    result = service.classify(["reduced appetite", "mild lameness"])

    assert result.severity == TriageSeverity.SELF_TREATABLE
    assert "No critical or urgent symptoms" in result.reason


def test_empty_symptoms_are_self_treatable(service: TriageService) -> None:
    result = service.classify([])

    assert result.severity == TriageSeverity.SELF_TREATABLE


def test_critical_takes_precedence_over_urgent(service: TriageService) -> None:
    result = service.classify(
        [
            "high fever",
            "difficulty breathing",
            "swollen painful udder quarter",
        ]
    )

    assert result.severity == TriageSeverity.CRITICAL
    assert result.reason == "Detected symptom: difficulty breathing"


def test_urgent_when_only_urgent_symptoms_present(service: TriageService) -> None:
    result = service.classify(["high fever", "reduced milk yield"])

    assert result.severity == TriageSeverity.URGENT
    assert result.reason == "Detected symptom: high fever"


@pytest.mark.parametrize(
    ("reported", "expected_catalog"),
    [
        ("DIFFICULTY BREATHING", "difficulty breathing"),
        ("High Fever", "high fever"),
        ("  swollen painful udder quarter  ", "swollen painful udder quarter"),
    ],
)
def test_case_insensitive_matching(
    service: TriageService,
    reported: str,
    expected_catalog: str,
) -> None:
    result = service.classify([reported])
    assert expected_catalog in result.reason


def test_duplicate_symptoms_do_not_change_classification(service: TriageService) -> None:
    result = service.classify(["high fever", "HIGH FEVER", "  high fever  "])

    assert result.severity == TriageSeverity.URGENT
    assert result.reason == "Detected symptom: high fever"


def test_first_critical_symptom_in_catalog_order_wins(service: TriageService) -> None:
    result = service.classify(["collapse", "seizures"])

    assert result.severity == TriageSeverity.CRITICAL
    assert result.reason == "Detected symptom: seizures"


def test_unrelated_symptoms_with_whitespace_are_ignored(service: TriageService) -> None:
    result = service.classify(["", "   ", "loss of appetite"])

    assert result.severity == TriageSeverity.SELF_TREATABLE
