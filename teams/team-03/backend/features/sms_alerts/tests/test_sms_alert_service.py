"""Unit tests for SmsAlertService."""

import pytest

from features.rag.schemas.disease import DiseaseMatch
from features.rag.schemas.enums import TriageSeverity
from features.rag.schemas.responses import TriageResult
from features.sms_alerts.schemas.alert import MAX_ALERT_MESSAGE_LENGTH
from features.sms_alerts.services.sms_alert_service import SmsAlertService


@pytest.fixture
def service() -> SmsAlertService:
    return SmsAlertService()


def _match(confidence: float, name: str = "Foot and Mouth Disease") -> DiseaseMatch:
    return DiseaseMatch(
        disease_id="fmd",
        disease_name=name,
        confidence_score=confidence,
        matched_symptoms=["high fever"],
        missing_symptoms=["drooling"],
    )


def _triage(severity: TriageSeverity) -> TriageResult:
    return TriageResult(
        severity=severity,
        reason=f"Detected symptom: example for {severity.value}",
    )


def test_lumpy_skin_disease_template_uses_real_newlines(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=DiseaseMatch(
            disease_id="lumpy-skin-disease",
            disease_name="Lumpy Skin Disease",
            confidence_score=0.44,
            matched_symptoms=["fever"],
            missing_symptoms=[],
        ),
        triage_result=_triage(TriageSeverity.SELF_TREATABLE),
        symptoms=["fever", "swelling of neck brisket or flanks"],
    )

    assert "\\n" not in draft.message
    assert "Animal: Cattle" in draft.message
    assert "Confidence:\n44%" in draft.message
    assert "Isolate the animal and apply insect control." in draft.message


def test_whatsapp_message_uses_bold_labels(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=_match(0.44, name="Lumpy Skin Disease"),
        triage_result=_triage(TriageSeverity.SELF_TREATABLE),
        symptoms=["fever"],
    )

    assert "*Animal:*" in draft.whatsapp_message
    assert "*Suspected Disease:*" in draft.whatsapp_message
    assert "📋" in draft.whatsapp_message
    assert "_Via PashuMitra AI_" in draft.whatsapp_message
    assert "\\n" not in draft.whatsapp_message


def test_urgent_case_message(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=_match(0.82),
        triage_result=_triage(TriageSeverity.URGENT),
        symptoms=["high fever", "drooling"],
    )

    assert draft.severity == TriageSeverity.URGENT
    assert "URGENT VETERINARY ALERT" in draft.message
    assert "Animal: Cattle" in draft.message
    assert "Foot and Mouth Disease" in draft.message
    assert "Confidence:\n82%" in draft.message
    assert "Symptoms:\nHigh Fever, Drooling" in draft.message
    assert "Severity:\nURGENT" in draft.message
    assert "Immediate veterinary attention recommended." in draft.message
    assert len(draft.message) <= MAX_ALERT_MESSAGE_LENGTH


def test_critical_case_message(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="buffalo",
        disease_match=_match(0.91, name="Anthrax"),
        triage_result=_triage(TriageSeverity.CRITICAL),
        symptoms=["difficulty breathing"],
    )

    assert "CRITICAL VETERINARY ALERT" in draft.message
    assert "Animal: Buffalo" in draft.message
    assert "Severity:\nCRITICAL" in draft.message
    assert "Immediate veterinary attention required." in draft.message
    assert "Confidence:\n91%" in draft.message


def test_self_treatable_case_message(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="goat",
        disease_match=_match(0.25, name="Mastitis"),
        triage_result=_triage(TriageSeverity.SELF_TREATABLE),
        symptoms=["reduced appetite"],
    )

    assert "VETERINARY ALERT" in draft.message
    assert "URGENT VETERINARY ALERT" not in draft.message
    assert "Severity:\nSELF TREATABLE" in draft.message
    assert "Monitor the animal and consult a veterinarian if symptoms worsen." in draft.message
    assert draft.confidence_score == pytest.approx(0.25)


def test_missing_symptoms_shows_none_reported(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=_match(0.5),
        triage_result=_triage(TriageSeverity.URGENT),
        symptoms=[],
    )

    assert draft.symptoms == []
    assert "Symptoms:\nNone reported" in draft.message


def test_confidence_formatting_rounds_to_whole_percent(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=_match(0.826),
        triage_result=_triage(TriageSeverity.URGENT),
        symptoms=["fever"],
    )

    assert "Confidence:\n83%" in draft.message


def test_duplicate_symptoms_are_deduplicated(service: SmsAlertService) -> None:
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=_match(0.6),
        triage_result=_triage(TriageSeverity.URGENT),
        symptoms=["fever", "FEVER", "  fever  "],
    )

    assert draft.symptoms == ["fever"]
    assert "Fever" in draft.message
    assert draft.message.count("Fever") == 1


def test_alert_draft_fields_populated(service: SmsAlertService) -> None:
    match = _match(0.75)
    triage = _triage(TriageSeverity.URGENT)

    draft = service.generate_alert(
        animal_type="sheep",
        disease_match=match,
        triage_result=triage,
        symptoms=["high fever"],
    )

    assert draft.animal_type == "Sheep"
    assert draft.suspected_disease == match.disease_name
    assert draft.confidence_score == pytest.approx(0.75)
    assert draft.severity == TriageSeverity.URGENT
    assert draft.symptoms == ["high fever"]
    assert draft.message


def test_message_enforced_under_max_length(service: SmsAlertService) -> None:
    long_symptoms = [f"symptom number {index} with extended description" for index in range(80)]
    draft = service.generate_alert(
        animal_type="cattle",
        disease_match=_match(0.5, name="A" * 200),
        triage_result=_triage(TriageSeverity.URGENT),
        symptoms=long_symptoms,
    )

    assert len(draft.message) <= MAX_ALERT_MESSAGE_LENGTH
