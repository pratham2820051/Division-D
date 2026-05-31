"""Intake prompts — open-ended questions that must not use yes/no diagnostic flow."""

from __future__ import annotations

from features.chat.schemas.messages import AssistantBlock, MessageType
from features.confidence_scoring.utils.symptom_normalizer import normalize_symptom

INTAKE_SYMPTOM_MARKERS = frozenset(
    {
        "symptom_collection",
        "animal_intake",
        "context",
    }
)

INTAKE_YES_PROMPT = (
    "Please describe what you see — for example: fever, swelling, drooling, or not eating."
)
INTAKE_NO_PROMPT = (
    "Please share any changes you notice in your animal's behaviour, appetite, or appearance."
)


def is_non_clinical_symptom_key(symptom: str | None) -> bool:
    """True when a tracking key is intake metadata, not a clinical sign."""
    if not symptom or not symptom.strip():
        return False
    normalized = normalize_symptom(symptom)
    if normalized in INTAKE_SYMPTOM_MARKERS:
        return True
    if normalized.startswith("context"):
        return True
    return False


def is_intake_diagnostic_question(
    *,
    active_symptom: str | None,
    active_question: str | None,
) -> bool:
    """True when the pending question expects free text, not yes/no."""
    if is_non_clinical_symptom_key(active_symptom):
        return True
    question = (active_question or "").lower()
    intake_phrases = (
        "what symptoms have you noticed",
        "which animal is affected",
        "what symptoms do you see",
    )
    return any(phrase in question for phrase in intake_phrases)


def build_symptom_intake_blocks(animal_type: str) -> list[AssistantBlock]:
    """Ask for symptoms in plain text (no yes/no diagnostic card)."""
    question = (
        f"What symptoms have you noticed in your {animal_type}? "
        "For example: fever, drooling, or not eating."
    )
    return [AssistantBlock(message_type=MessageType.TEXT, content=question)]


def build_generic_intake_blocks(context_size: int) -> list[AssistantBlock]:
    """Ask for animal + symptoms in plain text."""
    _ = context_size
    question = (
        "Which animal is affected (cow, goat, buffalo, sheep) "
        "and what symptoms do you see?"
    )
    return [AssistantBlock(message_type=MessageType.TEXT, content=question)]
