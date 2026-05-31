"""Regression tests for diagnosis finalization after follow-up answers."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.services.conversation_state import ConversationState
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.chat.utils.diagnosis_flow import (
    FINAL_CONFIDENCE_THRESHOLD,
    should_generate_sms_alert,
    should_show_final_diagnosis,
)
from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.memory.models.chat import MessageRole, new_message
from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel, TriageSeverity
from features.rag.schemas.responses import TriageResult
from features.rag.services.disease_document_service import DiseaseDocumentService
from features.triage.schemas.diagnostic import FollowUpQuestion


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
        symptoms=["high fever", "drooling"],
        critical_symptoms=["drooling"],
        first_aid=["Isolate immediately."],
        severity_level=DiseaseSeverityLevel.HIGH,
    )
    _write_disease(tmp_path, fmd)
    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    return ChatOrchestrator(document_service=document_service)


def _append_assistant(history: list, result) -> None:
    for block in result.blocks:
        history.append(
            _msg(
                MessageRole.ASSISTANT,
                block.content,
                message_type=block.message_type.value,
                payload=block.payload,
            )
        )


def test_yes_confirms_symptom_and_increases_confidence(
    fmd_orchestrator: ChatOrchestrator,
    service: SymptomExtractionService,
) -> None:
    first = fmd_orchestrator.process("My cow has high fever", context_size=0, recent_messages=[])
    history = [_msg(MessageRole.USER, "My cow has high fever")]
    _append_assistant(history, first)

    state_before = ConversationState.from_messages(
        history + [_msg(MessageRole.USER, "yes")],
        service,
        exclude_last_user_turn=True,
    )
    assert state_before.active_symptom is not None

    second = fmd_orchestrator.process(
        "yes",
        context_size=len(history) + 1,
        recent_messages=history + [_msg(MessageRole.USER, "yes")],
    )
    state_after = ConversationState.from_messages(
        history + [_msg(MessageRole.USER, "yes")],
        service,
        exclude_last_user_turn=False,
    )

    assert state_after.confirmed_symptoms
    assert second.confidence >= first.confidence


def test_no_rejects_symptom(service: SymptomExtractionService) -> None:
    state = ConversationState()
    state.set_active_question(
        "Are there blisters in the mouth or on the tongue?",
        "blisters on tongue and gums",
    )
    state.reject_symptom("blisters on tongue and gums")

    assert "blisters on tongue and gums" in state.rejected_symptoms
    assert state.should_skip_question(
        "Are there blisters in the mouth or on the tongue?",
        "blisters on tongue and gums",
    )


def test_fmd_question_then_yes_finalizes(fmd_orchestrator: ChatOrchestrator) -> None:
    first = fmd_orchestrator.process("My cow has high fever", context_size=0, recent_messages=[])
    assert MessageType.DIAGNOSTIC_QUESTION in {b.message_type for b in first.blocks}

    history = [_msg(MessageRole.USER, "My cow has high fever")]
    _append_assistant(history, first)
    history.append(_msg(MessageRole.USER, "yes"))

    final = fmd_orchestrator.process(
        "yes",
        context_size=len(history),
        recent_messages=history,
    )
    types = {block.message_type for block in final.blocks}
    assert MessageType.DISEASE_ANALYSIS in types
    assert MessageType.FIRST_AID in types
    assert MessageType.SMS_ALERT not in types
    assert final.confidence >= FINAL_CONFIDENCE_THRESHOLD
    assert MessageType.DIAGNOSTIC_QUESTION not in types


def test_finalize_without_sms_when_confidence_below_threshold() -> None:
    diagnosis = DiagnosisResponse(
        candidate_diseases=[
            DiseaseMatch(
                disease_id="fmd",
                disease_name="FMD",
                confidence_score=0.55,
                matched_symptoms=["fever"],
                missing_symptoms=["drooling"],
            )
        ],
        followup_questions=[],
        triage_result=TriageResult(severity=TriageSeverity.URGENT, reason="Fever."),
        sms_alert=None,
        requires_more_information=False,
    )
    state = ConversationState()

    assert should_show_final_diagnosis(diagnosis, state)
    assert not should_generate_sms_alert(diagnosis, state)


def test_still_gathering_when_followup_pending() -> None:
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
        triage_result=TriageResult(severity=TriageSeverity.URGENT, reason="Fever."),
        sms_alert=None,
        requires_more_information=True,
    )

    assert not should_show_final_diagnosis(diagnosis, ConversationState())
    assert not should_generate_sms_alert(diagnosis, ConversationState())
