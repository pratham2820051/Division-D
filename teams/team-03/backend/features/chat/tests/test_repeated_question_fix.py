"""Regression: diagnostic questions must not repeat after YES/NO."""

from __future__ import annotations

from features.chat.schemas.messages import MessageType
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.utils.localization import localize_blocks
from features.memory.models.chat import MessageRole, new_message


def _msg(role, content, *, message_type="text", payload=None):
    return new_message("chat-1", role, content, message_type=message_type, payload=payload)


def _anthrax_question_keys(blocks) -> list[str]:
    keys: list[str] = []
    for block in blocks:
        if block.message_type != MessageType.DIAGNOSTIC_QUESTION or not block.payload:
            continue
        keys.append(
            str(
                block.payload.get("question_key")
                or block.payload.get("question")
                or "",
            ).lower()
        )
    return keys


def test_yes_advances_to_next_question_english() -> None:
    orchestrator = ChatOrchestrator()
    first = orchestrator.process("My goat has fever", context_size=0, language="en")
    q1_keys = _anthrax_question_keys(first.blocks)
    assert q1_keys, "expected first diagnostic question"

    history = [_msg(MessageRole.USER, "My goat has fever")]
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
        "yes",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "yes")],
        language="en",
    )
    q2_keys = _anthrax_question_keys(second.blocks)
    assert q2_keys, "expected second diagnostic question"
    assert q2_keys[0] not in q1_keys


def test_yes_advances_after_kannada_localization() -> None:
    """Symptom keys must stay English when UI language is Kannada."""
    orchestrator = ChatOrchestrator()
    first = orchestrator.process("My goat has fever", context_size=0, language="kn")
    localized = localize_blocks(first.blocks, "kn")
    q_block = next(
        b for b in localized if b.message_type == MessageType.DIAGNOSTIC_QUESTION
    )
    assert q_block.payload.get("symptom_key") == "bloody discharge from natural openings"
    assert q_block.payload.get("question_key")

    history = [_msg(MessageRole.USER, "My goat has fever")]
    for block in localized:
        history.append(
            _msg(
                MessageRole.ASSISTANT,
                block.content,
                message_type=block.message_type.value,
                payload=block.payload,
            )
        )

    second = orchestrator.process(
        "yes",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "yes")],
        language="kn",
    )
    q2 = _anthrax_question_keys(second.blocks)
    q1_key = str(q_block.payload.get("question_key")).lower()
    assert all(q != q1_key for q in q2)


def test_no_rejects_symptom_and_advances() -> None:
    orchestrator = ChatOrchestrator()
    first = orchestrator.process("My goat has fever", context_size=0, language="en")
    q1_key = _anthrax_question_keys(first.blocks)[0]

    history = [_msg(MessageRole.USER, "My goat has fever")]
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
        "no",
        context_size=len(history),
        recent_messages=history + [_msg(MessageRole.USER, "no")],
        language="en",
    )
    q2_keys = _anthrax_question_keys(second.blocks)
    assert q1_key not in q2_keys
