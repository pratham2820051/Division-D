"""Domain guard and conversation state leak tests."""

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
from features.chat.utils.domain_classifier import (
    DOMAIN_GUARDRAIL_TEXT,
    MessageDomain,
    classify_message_domain,
    is_guardrail_response,
)
from features.memory.models.chat import MessageRole, new_message
from features.rag.schemas.disease import Disease
from features.rag.schemas.enums import AnimalType, DiseaseSeverityLevel
from features.rag.services.disease_document_service import DiseaseDocumentService


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


@pytest.mark.parametrize(
    "message,expected",
    [
        ("My cow has fever", MessageDomain.LIVESTOCK_HEALTH),
        ("When is IPL final?", MessageDomain.OUT_OF_SCOPE),
        ("What is Java?", MessageDomain.OUT_OF_SCOPE),
        ("Who is Prime Minister?", MessageDomain.OUT_OF_SCOPE),
        ("drooling", MessageDomain.LIVESTOCK_HEALTH),
    ],
)
def test_classify_message_domain(message: str, expected: MessageDomain) -> None:
    assert classify_message_domain(message) is expected


def test_ipl_after_fever_does_not_continue_diagnosis(
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

    result = fmd_orchestrator.process(
        "When is IPL final?",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "When is IPL final?")],
    )

    assert DOMAIN_GUARDRAIL_TEXT in result.reply
    assert result.disease is None
    types = {block.message_type for block in result.blocks}
    assert MessageType.DIAGNOSTIC_QUESTION not in types
    assert MessageType.DISEASE_ANALYSIS not in types


def test_out_of_scope_after_guardrail_starts_fresh_goat_case(
    fmd_orchestrator: ChatOrchestrator,
    service: SymptomExtractionService,
) -> None:
    history = [
        _msg(MessageRole.USER, "My cow has fever"),
        _msg(MessageRole.ASSISTANT, DOMAIN_GUARDRAIL_TEXT),
    ]

    result = fmd_orchestrator.process(
        "My goat has lameness",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "My goat has lameness")],
    )

    state = ConversationState.from_messages(
        history + [_msg(MessageRole.USER, "My goat has lameness")],
        service,
        exclude_last_user_turn=True,
    )
    state._absorb_user_message(state, "My goat has lameness", service)
    assert state.animal_type == "goat"
    assert "fever" not in state.active_symptoms()
    assert result.disease is None or "goat" in str(result.blocks).lower()


def test_guardrail_resets_conversation_state(service: SymptomExtractionService) -> None:
    messages = [
        _msg(MessageRole.USER, "My cow has fever"),
        _msg(MessageRole.ASSISTANT, DOMAIN_GUARDRAIL_TEXT),
        _msg(MessageRole.USER, "My goat has lameness"),
    ]
    state = ConversationState.from_messages(messages, service, exclude_last_user_turn=True)
    state._absorb_user_message(state, "My goat has lameness", service)

    assert state.animal_type == "goat"
    assert "fever" not in state.active_symptoms()


def test_livestock_followup_after_fever_still_works(
    fmd_orchestrator: ChatOrchestrator,
    service: SymptomExtractionService,
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
        "drooling",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "drooling")],
    )

    assert MessageType.DIAGNOSTIC_QUESTION in {b.message_type for b in second.blocks} or second.disease


def test_is_guardrail_response() -> None:
    assert is_guardrail_response(DOMAIN_GUARDRAIL_TEXT)
    assert not is_guardrail_response("Based on fever, FMD is one possibility.")
