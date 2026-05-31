"""Intake questions must not use yes/no diagnostic flow or dead-end on Yes."""

from __future__ import annotations

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.services.conversation_state import ConversationState
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.chat.utils.intake_flow import INTAKE_YES_PROMPT, is_intake_diagnostic_question
from features.chat.utils.message_builder import build_symptom_intake
from features.memory.models.chat import MessageRole, new_message


@pytest.fixture
def service() -> SymptomExtractionService:
    return SymptomExtractionService(extractor=RuleBasedSymptomExtractor())


@pytest.fixture
def orchestrator(service: SymptomExtractionService) -> ChatOrchestrator:
    return ChatOrchestrator(symptom_extractor=service)


def _msg(role: MessageRole, content: str, *, message_type: str = "text", payload=None):
    return new_message("chat-1", role, content, message_type=message_type, payload=payload)


def test_symptom_intake_is_plain_text_not_diagnostic_card() -> None:
    blocks = build_symptom_intake("cattle")
    assert len(blocks) == 1
    assert blocks[0].message_type == MessageType.TEXT
    assert "What symptoms have you noticed" in blocks[0].content


def test_is_intake_diagnostic_question_detects_legacy_card() -> None:
    assert is_intake_diagnostic_question(
        active_symptom="symptom_collection",
        active_question="What symptoms have you noticed in your cattle?",
    )


def test_yes_on_legacy_intake_prompts_for_symptoms(
    orchestrator: ChatOrchestrator,
) -> None:
    history = [
        _msg(MessageRole.USER, "My cow"),
        _msg(
            MessageRole.ASSISTANT,
            "What symptoms?",
            message_type=MessageType.DIAGNOSTIC_QUESTION.value,
            payload={
                "question": "What symptoms have you noticed in your cattle?",
                "context": "symptom_collection",
            },
        ),
    ]
    result = orchestrator.process(
        "Yes",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "Yes")],
    )
    assert INTAKE_YES_PROMPT in result.reply
    assert not any(
        block.message_type == MessageType.DIAGNOSTIC_QUESTION for block in result.blocks
    )


def test_cow_only_then_fever_asks_disease_followup(
    orchestrator: ChatOrchestrator,
) -> None:
    first = orchestrator.process("My cow", context_size=0, recent_messages=[])
    assert any(
        block.message_type == MessageType.TEXT
        and "What symptoms have you noticed" in block.content
        for block in first.blocks
    )
    assert not any(
        block.message_type == MessageType.DIAGNOSTIC_QUESTION for block in first.blocks
    )

    history = [_msg(MessageRole.USER, "My cow")]
    for block in first.blocks:
        history.append(
            _msg(
                MessageRole.ASSISTANT,
                block.content,
                message_type=block.message_type.value,
                payload=block.payload,
            )
        )

    second = orchestrator.process(
        "fever and swelling",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "fever and swelling")],
    )
    assert any(
        block.message_type == MessageType.DIAGNOSTIC_QUESTION for block in second.blocks
    )


def test_symptom_collection_not_counted_as_clinical() -> None:
    state = ConversationState()
    state.confirm_symptom("symptom_collection")
    assert state.active_symptoms() == []
