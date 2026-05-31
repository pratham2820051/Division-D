"""Demo-quality conversation flow audit tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.services.conversation_state import ConversationState
from features.chat.services.diagnosis_orchestrator import DiagnosisOrchestrator
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.chat.utils.diagnosis_flow import (
    FINAL_CONFIDENCE_THRESHOLD,
    should_generate_sms_alert,
)
from features.chat.utils.message_builder import build_from_diagnosis
from features.memory.models.chat import MessageRole, new_message
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.schemas.responses import TriageResult
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.rag.schemas.enums import TriageSeverity
from features.sms_alerts.schemas.alert import AlertDraft
from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.rag.schemas.disease import DiseaseMatch
from features.triage.schemas.diagnostic import FollowUpQuestion
from features.voice.services.mock_stt import MockSpeechToTextProvider


def _msg(role: MessageRole, content: str, *, message_type: str = "text", payload=None):
    return new_message("chat-1", role, content, message_type=message_type, payload=payload)


def _write_disease(directory: Path, disease: Disease) -> None:
    path = directory / f"{disease.disease_id}.json"
    path.write_text(json.dumps(disease.model_dump(mode="json")), encoding="utf-8")


@pytest.fixture
def service() -> SymptomExtractionService:
    return SymptomExtractionService(extractor=RuleBasedSymptomExtractor())


@pytest.fixture
def fmd_orchestrator(tmp_path: Path) -> ChatOrchestrator:
    fmd = Disease(
        disease_id="foot-and-mouth-disease",
        disease_name="Foot and Mouth Disease",
        animal_type=AnimalType.CATTLE,
        description="FMD",
        symptoms=["fever", "drooling"],
        critical_symptoms=["drooling"],
        first_aid=["Isolate immediately."],
        severity_level=DiseaseSeverityLevel.HIGH,
    )
    _write_disease(tmp_path, fmd)
    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    return ChatOrchestrator(document_service=document_service)


# --- Conversation state ---


def test_fever_then_drooling_keeps_cattle(service: SymptomExtractionService) -> None:
    messages = [
        _msg(MessageRole.USER, "My cow has fever"),
        _msg(MessageRole.USER, "drooling"),
    ]
    state = ConversationState.from_messages(messages, service, exclude_last_user_turn=True)
    state._absorb_user_message(state, "drooling", service)

    assert state.animal_type == "cattle"
    assert "fever" in state.active_symptoms()
    assert "drooling" in state.active_symptoms()


def test_rejected_symptom_not_asked_again(service: SymptomExtractionService) -> None:
    state = ConversationState()
    state.record_symptom("fever")
    state.set_active_question("Are there mouth blisters?", "blisters on tongue and gums")
    state.reject_symptom("blisters on tongue and gums")

    assert state.should_skip_question(
        "Are there mouth blisters?",
        "blisters on tongue and gums",
    )


# --- Follow-up flow ---


def test_ambiguous_turn_shows_only_question_blocks(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process("My cow has fever", context_size=0, recent_messages=[])

    types = {block.message_type for block in result.blocks}
    assert MessageType.TEXT in types
    assert MessageType.DIAGNOSTIC_QUESTION in types
    assert MessageType.FIRST_AID not in types
    assert MessageType.SMS_ALERT not in types
    assert MessageType.DISEASE_ANALYSIS not in types
    assert "one possibility" in result.reply.lower()


def test_final_turn_shows_full_recommendation(fmd_orchestrator: ChatOrchestrator) -> None:
    result = fmd_orchestrator.process(
        "My cow has fever and is drooling",
        context_size=0,
        recent_messages=[],
    )

    types = {block.message_type for block in result.blocks}
    assert MessageType.TEXT in types
    assert MessageType.DISEASE_ANALYSIS in types
    assert MessageType.FIRST_AID in types
    assert MessageType.SMS_ALERT not in types
    assert result.confidence >= FINAL_CONFIDENCE_THRESHOLD


def test_yes_answer_reruns_diagnosis_without_reasking(
    fmd_orchestrator: ChatOrchestrator,
) -> None:
    first = fmd_orchestrator.process("My cow has fever", context_size=0, recent_messages=[])
    history = [_msg(MessageRole.USER, "My cow has fever")]
    for block in first.blocks:
        history.append(
            _msg(
                MessageRole.ASSISTANT,
                block.content,
                message_type=block.message_type.value,
                payload=block.payload,
            )
        )

    second = fmd_orchestrator.process(
        "yes",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "yes")],
    )
    assert second.confidence >= first.confidence
    assert not any(
        "what type of animal" in b.content.lower()
        for b in second.blocks
        if b.message_type == MessageType.DIAGNOSTIC_QUESTION
    )


# --- SMS rules ---


def test_sms_not_generated_during_gathering() -> None:
    diagnosis = DiagnosisResponse(
        candidate_diseases=[
            DiseaseMatch(
                disease_id="fmd",
                disease_name="FMD",
                confidence_score=0.5,
                matched_symptoms=["fever"],
                missing_symptoms=["drooling"],
            )
        ],
        followup_questions=[
            FollowUpQuestion(
                question="Is the animal drooling?",
                symptom="drooling",
                disease_candidates=["FMD"],
            )
        ],
        triage_result=TriageResult(
            severity=TriageSeverity.URGENT,
            reason="Fever reported.",
        ),
        sms_alert=None,
        requires_more_information=True,
    )
    assert not should_generate_sms_alert(diagnosis, ConversationState())


def test_sms_generated_when_confident_and_no_followups() -> None:
    diagnosis = DiagnosisResponse(
        candidate_diseases=[
            DiseaseMatch(
                disease_id="fmd",
                disease_name="FMD",
                confidence_score=0.85,
                matched_symptoms=["fever", "drooling"],
                missing_symptoms=[],
            )
        ],
        followup_questions=[],
        triage_result=TriageResult(severity=TriageSeverity.URGENT, reason="High confidence."),
        sms_alert=AlertDraft(
            animal_type="cattle",
            suspected_disease="FMD",
            confidence_score=0.85,
            severity=TriageSeverity.URGENT,
            message="Alert",
            whatsapp_message="*Alert*",
        ),
        requires_more_information=False,
    )
    assert should_generate_sms_alert(diagnosis, ConversationState())


def test_build_from_diagnosis_skips_sms_during_questions() -> None:
    diagnosis = DiagnosisResponse(
        candidate_diseases=[
            DiseaseMatch(
                disease_id="fmd",
                disease_name="FMD",
                confidence_score=0.4,
                matched_symptoms=["fever"],
                missing_symptoms=["drooling"],
            )
        ],
        followup_questions=[
            FollowUpQuestion(
                question="Is the animal drooling?",
                symptom="drooling",
                disease_candidates=["FMD"],
            )
        ],
        triage_result=TriageResult(severity=TriageSeverity.URGENT, reason="Gathering info."),
        sms_alert=AlertDraft(
            animal_type="cattle",
            suspected_disease="FMD",
            confidence_score=0.4,
            severity=TriageSeverity.URGENT,
            message="Should not show",
            whatsapp_message="Should not show",
        ),
        requires_more_information=True,
    )
    blocks = build_from_diagnosis(
        diagnosis,
        first_aid_steps=["Isolate."],
        animal_type_label="cattle",
        conversation_state=ConversationState(),
    )
    types = {block.message_type for block in blocks}
    assert MessageType.DIAGNOSTIC_QUESTION in types
    assert MessageType.SMS_ALERT not in types
    assert MessageType.FIRST_AID not in types


# --- Farmer language ---


@pytest.mark.parametrize(
    "message,expected",
    [
        ("Cow has mouth water coming", "excessive salivation and drooling"),
        ("Buffalo not eating", "reduced appetite"),
        ("Goat with skin bumps", "firm skin nodules on neck and body"),
        ("Sheep walking problem", "lameness and reluctance to walk"),
        ("Cow milk reduced", "reduced milk yield"),
        ("Cattle not standing", "unable to stand"),
        ("Cow swollen neck", "swelling of neck brisket or flanks"),
    ],
)
def test_farmer_language_phrases(
    service: SymptomExtractionService,
    message: str,
    expected: str,
) -> None:
    result = service.extract(message)
    assert expected in result.symptoms


# --- Voice language ---


def test_mock_stt_respects_language_hint() -> None:
    import asyncio

    async def _run() -> None:
        provider = MockSpeechToTextProvider()
        kn = await provider.transcribe(b"audio", language="kn")
        en = await provider.transcribe(b"audio", language="en")

        assert kn.language == "kn"
        assert en.language == "en"
        assert kn.text != en.text or kn.language != en.language

    asyncio.run(_run())
