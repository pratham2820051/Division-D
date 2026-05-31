"""Smart question generation — native script animals and no redundant intake."""

from __future__ import annotations

import pytest

from features.chat.services.conversation_state import ConversationState
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
    detect_animal_type_in_text,
)
from features.chat.utils.farmer_language_dictionary import ANIMAL_INTAKE_QUESTION_MARKERS
from features.chat.utils.message_builder import build_contextual_intake
from features.chat.utils.text_preprocessor import preprocess_farmer_message
from features.rag.schemas.enums import AnimalType


@pytest.fixture
def service() -> SymptomExtractionService:
    return SymptomExtractionService(extractor=RuleBasedSymptomExtractor())


KANNADA_GOAT_FEVER = "ನನ್ನ ಮೇಕೆಗೆ ಜ್ವರ ಇದೆ"


def test_preprocess_kannada_goat_fever(service: SymptomExtractionService) -> None:
    preprocessed = preprocess_farmer_message(KANNADA_GOAT_FEVER)
    assert "goat" in preprocessed
    assert "fever" in preprocessed


def test_extract_kannada_goat_fever(service: SymptomExtractionService) -> None:
    result = service.extract(KANNADA_GOAT_FEVER)
    assert result.animal_type == AnimalType.GOAT
    assert "fever" in [s.lower() for s in result.symptoms]


def test_detect_animal_type_in_kannada_goat_message() -> None:
    text = preprocess_farmer_message(KANNADA_GOAT_FEVER)
    assert detect_animal_type_in_text(text) == AnimalType.GOAT


def test_conversation_state_kannada_goat_fever(service: SymptomExtractionService) -> None:
    state = ConversationState(language="kn")
    ConversationState._absorb_user_message(state, KANNADA_GOAT_FEVER, service)
    assert state.animal_type == "goat"
    assert "fever" in [s.lower() for s in state.active_symptoms()]


def test_kannada_goat_fever_skips_which_animal_question(
    service: SymptomExtractionService,
) -> None:
    orchestrator = ChatOrchestrator(symptom_extractor=service)
    result = orchestrator.process(KANNADA_GOAT_FEVER, context_size=0, language="kn")
    reply_lower = result.reply.lower()
    for marker in ANIMAL_INTAKE_QUESTION_MARKERS:
        assert marker not in reply_lower


def test_contextual_intake_never_asks_animal_when_goat_known(
    service: SymptomExtractionService,
) -> None:
    state = ConversationState(language="kn")
    ConversationState._absorb_user_message(state, KANNADA_GOAT_FEVER, service)
    blocks = build_contextual_intake(state, context_size=0)
    question = blocks[-1].content if blocks else ""
    assert "Which animal is affected" not in question


def test_my_goat_has_fever_skips_animal_intake(service: SymptomExtractionService) -> None:
    orchestrator = ChatOrchestrator(symptom_extractor=service)
    result = orchestrator.process("My goat has fever", context_size=0, language="en")
    assert "Which animal is affected" not in result.reply
