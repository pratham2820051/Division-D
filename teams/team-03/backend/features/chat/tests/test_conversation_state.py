"""Tests for conversation state, memory, and follow-up flow."""

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
from features.memory.models.chat import MessageRole, new_message
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.disease_document_service import DiseaseDocumentService


def _msg(role: MessageRole, content: str, *, message_type: str = "text", payload=None):
    return new_message("chat-1", role, content, message_type=message_type, payload=payload)


@pytest.fixture
def service() -> SymptomExtractionService:
    return SymptomExtractionService(extractor=RuleBasedSymptomExtractor())


def test_conversation_state_remembers_animal_and_symptoms(service: SymptomExtractionService) -> None:
    messages = [
        _msg(MessageRole.USER, "My cow has fever"),
    ]
    state = ConversationState.from_messages(messages, service, exclude_last_user_turn=False)
    assert state.animal_type == "cattle"
    assert "fever" in state.active_symptoms()


def test_conversation_state_animal_only_reply(service: SymptomExtractionService) -> None:
    messages = [
        _msg(MessageRole.USER, "My cow has fever"),
        _msg(
            MessageRole.ASSISTANT,
            "What symptoms?",
            message_type=MessageType.DIAGNOSTIC_QUESTION.value,
            payload={"question": "What symptoms?", "context": "symptom_collection"},
        ),
        _msg(MessageRole.USER, "Cow"),
    ]
    state = ConversationState.from_messages(messages, service, exclude_last_user_turn=True)
    state._absorb_user_message(state, "Cow", service)
    assert state.animal_type == "cattle"
    assert "fever" in state.active_symptoms()


def test_yes_answer_confirms_symptom(service: SymptomExtractionService) -> None:
    messages = [
        _msg(MessageRole.USER, "My cow has fever"),
        _msg(
            MessageRole.ASSISTANT,
            "Are there blisters?",
            message_type=MessageType.DIAGNOSTIC_QUESTION.value,
            payload={
                "question": "Are there blisters in the mouth?",
                "context": "blisters on tongue and gums",
            },
        ),
    ]
    state = ConversationState.from_messages(messages, service, exclude_last_user_turn=True)
    assert state.active_symptom == "blisters on tongue and gums"

    state.confirm_symptom(state.active_symptom or "")
    assert "blisters on tongue and gums" in state.active_symptoms()


def test_no_answer_rejects_symptom(service: SymptomExtractionService) -> None:
    state = ConversationState()
    state.record_symptom("fever")
    state.reject_symptom("blisters on tongue and gums")
    assert "fever" in state.active_symptoms()
    state.confirm_symptom("blisters on tongue and gums")
    state.reject_symptom("blisters on tongue and gums")
    assert "blisters on tongue and gums" not in state.active_symptoms()


def test_should_skip_after_answer_recorded() -> None:
    state = ConversationState()
    question = "Are there blisters in the mouth?"
    symptom = "blisters on tongue and gums"
    state.set_active_question(question, symptom)
    assert not state.should_skip_question(question, symptom)
    state.record_diagnostic_answer(question, symptom, confirmed=True)
    assert state.should_skip_question(question, symptom)
    assert symptom in state.active_symptoms()


def test_farmer_phrases_extracted(service: SymptomExtractionService) -> None:
    result = service.extract("Cow has mouth water coming and not eating")
    assert "excessive salivation and drooling" in result.symptoms
    assert "reduced appetite" in result.symptoms


def test_typo_disease_alias(service: SymptomExtractionService) -> None:
    mention = service.recognize_disease_mention("goat with antax")
    assert mention is not None
    assert mention.disease_id == "anthrax"


def _write_disease(directory: Path, disease: Disease) -> None:
    path = directory / f"{disease.disease_id}.json"
    path.write_text(json.dumps(disease.model_dump(mode="json")), encoding="utf-8")


@pytest.fixture
def fmd_orchestrator(tmp_path: Path) -> ChatOrchestrator:
    fmd = Disease(
        disease_id="foot-and-mouth-disease",
        disease_name="Foot and Mouth Disease",
        animal_type=AnimalType.CATTLE,
        description="FMD",
        symptoms=[
            "fever",
            "high fever",
            "blisters on tongue and gums",
            "excessive salivation and drooling",
        ],
        critical_symptoms=["blisters on tongue and gums"],
        severity_level=DiseaseSeverityLevel.HIGH,
    )
    _write_disease(tmp_path, fmd)

    document_service = DiseaseDocumentService(documents_dir=tmp_path)
    return ChatOrchestrator(document_service=document_service)


def test_fever_then_yes_mouth_ulcers_increases_fmd_confidence(
    fmd_orchestrator: ChatOrchestrator,
) -> None:
    first = fmd_orchestrator.process(
        "My cow has fever",
        context_size=0,
        recent_messages=[],
    )
    assert first.disease is not None
    initial_confidence = first.confidence

    history = [
        _msg(MessageRole.USER, "My cow has fever"),
    ]
    for block in first.blocks:
        if block.message_type == MessageType.DIAGNOSTIC_QUESTION:
            history.append(
                _msg(
                    MessageRole.ASSISTANT,
                    block.content,
                    message_type=MessageType.DIAGNOSTIC_QUESTION.value,
                    payload=block.payload,
                )
            )

    second = fmd_orchestrator.process(
        "yes",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "yes")],
    )
    assert second.confidence >= initial_confidence
    assert second.disease == "Foot and Mouth Disease"


def test_animal_not_reasked_after_cow_fever(fmd_orchestrator: ChatOrchestrator) -> None:
    first = fmd_orchestrator.process("My cow has fever", context_size=0, recent_messages=[])
    questions = [
        b.content.lower()
        for b in first.blocks
        if b.message_type == MessageType.DIAGNOSTIC_QUESTION
    ]
    assert not any("what type of animal" in q for q in questions)

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
        "Cow",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "Cow")],
    )
    followups = [
        b.content.lower()
        for b in second.blocks
        if b.message_type == MessageType.DIAGNOSTIC_QUESTION
    ]
    assert not any("what type of animal" in q for q in followups)
