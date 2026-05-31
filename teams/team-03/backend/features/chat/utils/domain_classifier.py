"""Classify farmer messages as livestock health vs out-of-scope queries."""

from __future__ import annotations

import re
from enum import Enum

from features.chat.services.symptom_extraction_service import (
    SymptomExtractionService,
    detect_animal_only_message,
)
from features.chat.utils.text_preprocessor import (
    extract_farmer_phrase_symptoms,
    normalize_whitespace,
    preprocess_farmer_message,
)

DOMAIN_GUARDRAIL_TEXT = (
    "I am a livestock health assistant. Please describe the animal and its symptoms."
)


class MessageDomain(str, Enum):
    LIVESTOCK_HEALTH = "livestock_health"
    OUT_OF_SCOPE = "out_of_scope"


_OUT_OF_SCOPE_PATTERNS: tuple[str, ...] = (
    r"\bipl\b",
    r"\bcricket\b",
    r"\bprime minister\b",
    r"\bwho won\b",
    r"\bweather forecast\b",
    r"\bstock market\b",
    r"\bmovie review\b",
    r"\bfootball score\b",
    r"\bwhat is java\b",
    r"\bwhat is python\b",
    r"\bwhat is javascript\b",
    r"\bhow to code\b",
    r"\bprogramming\b",
)

_GENERAL_QUESTION_PATTERNS: tuple[str, ...] = (
    r"^what is\b",
    r"^who is\b",
    r"^when is\b",
    r"^where is\b",
    r"^why is\b",
    r"^how much\b",
    r"^tell me about\b",
)

_LIVESTOCK_HINTS: tuple[str, ...] = (
    "cow",
    "cattle",
    "buffalo",
    "goat",
    "sheep",
    "chicken",
    "hen",
    "duck",
    "pig",
    "animal",
    "livestock",
    "pashu",
    "symptom",
    "fever",
    "udder",
    "milk",
    "drool",
    "lame",
    "lameness",
    "abort",
    "anthrax",
    "mastitis",
    "fmd",
    "blister",
    "calving",
    "herd",
    "farm",
)


def classify_message_domain(
    message: str,
    *,
    extractor: object | None = None,
) -> MessageDomain:
    """
    Classify the *current* user message only.

    Prior diagnosis context must not bypass this check.
    """
    text = normalize_whitespace(message)
    preprocessed = preprocess_farmer_message(message)
    if not text:
        return MessageDomain.LIVESTOCK_HEALTH

    if any(re.search(pattern, text) for pattern in _OUT_OF_SCOPE_PATTERNS):
        return MessageDomain.OUT_OF_SCOPE

    if any(hint in text or hint in preprocessed for hint in _LIVESTOCK_HINTS):
        return MessageDomain.LIVESTOCK_HEALTH

    if extract_farmer_phrase_symptoms(message):
        return MessageDomain.LIVESTOCK_HEALTH

    if extractor is not None and isinstance(extractor, SymptomExtractionService):
        extracted = extractor.extract(message)
        if extracted.symptoms:
            return MessageDomain.LIVESTOCK_HEALTH
        if extractor.recognize_disease_mention(message) is not None:
            return MessageDomain.LIVESTOCK_HEALTH
        if detect_animal_only_message(message) is not None:
            return MessageDomain.LIVESTOCK_HEALTH

    if "?" in text:
        if any(re.search(pattern, text) for pattern in _GENERAL_QUESTION_PATTERNS):
            return MessageDomain.OUT_OF_SCOPE
        return MessageDomain.OUT_OF_SCOPE

    return MessageDomain.LIVESTOCK_HEALTH


def is_guardrail_response(content: str) -> bool:
    """True when assistant text is a domain or voice-clarity reset message."""
    normalized = content.strip().lower()
    if DOMAIN_GUARDRAIL_TEXT.lower() in normalized:
        return True
    if "could not clearly understand the voice input" in normalized:
        return True
    if "spoke in" in normalized and "selected" in normalized:
        return True
    return False
