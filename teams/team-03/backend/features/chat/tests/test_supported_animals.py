"""Supported animal validation before diagnosis."""

from __future__ import annotations

import pytest

from features.chat.schemas.messages import MessageType
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
    detect_animal_type_in_text,
)
from features.chat.utils.supported_animals import (
    UNSUPPORTED_ANIMAL_MESSAGE,
    is_supported_animal_type,
    is_unsupported_animal_type,
)
from features.chat.utils.text_preprocessor import preprocess_farmer_message
from features.rag.schemas.enums import AnimalType


@pytest.fixture
def service() -> SymptomExtractionService:
    return SymptomExtractionService(extractor=RuleBasedSymptomExtractor())


@pytest.mark.parametrize(
    ("animal", "supported"),
    [
        ("cattle", True),
        ("buffalo", True),
        ("goat", True),
        ("sheep", True),
        ("pig", False),
        ("poultry", False),
        (None, True),
    ],
)
def test_supported_animal_helpers(animal: str | None, supported: bool) -> None:
    assert is_supported_animal_type(animal) is supported
    assert is_unsupported_animal_type(animal) is (not supported and animal is not None)


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("My cow has fever", AnimalType.CATTLE),
        ("My buffalo has fever", AnimalType.BUFFALO),
        ("My goat has fever", AnimalType.GOAT),
        ("My sheep has fever", AnimalType.SHEEP),
        ("ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ", AnimalType.CATTLE),
        ("ನನ್ನ ಮೇಕೆಗೆ ಜ್ವರ", AnimalType.GOAT),
        ("ನನ್ನ ಎಮ್ಮೆಗೆ ಜ್ವರ", AnimalType.BUFFALO),
        ("ನನ್ನ ಕುರಿಗೆ ಜ್ವರ", AnimalType.SHEEP),
        ("मेरी गाय को बुखार", AnimalType.CATTLE),
        ("मेरी बकरी को बुखार", AnimalType.GOAT),
        ("मेरी भैंस को बुखार", AnimalType.BUFFALO),
        ("मेरी भेड़ को बुखार", AnimalType.SHEEP),
    ],
)
def test_supported_animal_extraction(message: str, expected: AnimalType) -> None:
    text = preprocess_farmer_message(message)
    assert detect_animal_type_in_text(text) == expected


def test_pig_blocked_from_diagnosis(service: SymptomExtractionService) -> None:
    orchestrator = ChatOrchestrator(symptom_extractor=service)
    result = orchestrator.process("My pig has fever", context_size=0, language="en")
    assert UNSUPPORTED_ANIMAL_MESSAGE in result.reply
    assert result.disease is None
    assert result.follow_up_question is None
    assert not any(
        b.message_type == MessageType.DIAGNOSTIC_QUESTION for b in result.blocks
    )
    assert not any(
        b.message_type == MessageType.DISEASE_ANALYSIS for b in result.blocks
    )


def test_poultry_blocked(service: SymptomExtractionService) -> None:
    orchestrator = ChatOrchestrator(symptom_extractor=service)
    result = orchestrator.process("My chicken has fever", context_size=0, language="en")
    assert UNSUPPORTED_ANIMAL_MESSAGE in result.reply


def test_goat_still_diagnoses(service: SymptomExtractionService) -> None:
    orchestrator = ChatOrchestrator(symptom_extractor=service)
    result = orchestrator.process("My goat has fever", context_size=0, language="en")
    assert UNSUPPORTED_ANIMAL_MESSAGE not in result.reply
    assert any(
        b.message_type in {MessageType.DIAGNOSTIC_QUESTION, MessageType.DISEASE_ANALYSIS}
        for b in result.blocks
    ) or result.follow_up_question is not None
