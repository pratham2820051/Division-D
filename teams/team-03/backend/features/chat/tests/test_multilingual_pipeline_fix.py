"""Multilingual pipeline fix validation — language, animals, translation."""

from __future__ import annotations

import asyncio

import pytest

from features.chat.schemas.messages import AssistantBlock, MessageType
from features.chat.services.conversation_state import ConversationState
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
)
from features.chat.utils.conversation_language import resolve_conversation_language
from features.chat.utils.localization import localize_blocks
from features.chat.utils.message_language import infer_language_from_message
from features.rag.schemas.enums import AnimalType
from features.translation.services.static_translation_provider import (
    StaticPhraseTranslationProvider,
)
from features.translation.services.translation_service import TranslationService
from features.translation.schemas.request import TargetLanguage, TranslateRequest


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("Nanna hasuvige jwara bandide", "kn"),
        ("Meri gai ko bukhar hai", "hi"),
        ("My cow has fever", None),
        ("ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ", "kn"),
        ("मेरी गाय को बुखार", "hi"),
    ],
)
def test_infer_language_from_message(message: str, expected: str | None) -> None:
    assert infer_language_from_message(message) == expected


def test_resolve_language_kannada_romanized_when_ui_en() -> None:
    assert (
        resolve_conversation_language(
            "en",
            message_text="Nanna hasuvige jwara bandide",
        )
        == "kn"
    )


def test_resolve_language_hindi_romanized_when_ui_en() -> None:
    assert (
        resolve_conversation_language(
            "en",
            message_text="Meri gai ko bukhar hai",
        )
        == "hi"
    )


def test_explicit_kannada_ui_overrides_wrong_inference() -> None:
    assert (
        resolve_conversation_language(
            "kn",
            message_text="My cow has fever",
        )
        == "kn"
    )


def test_kannada_animal_and_fever_extraction() -> None:
    service = SymptomExtractionService(extractor=RuleBasedSymptomExtractor())
    result = service.extract("Nanna hasuvige jwara bandide")
    assert result.animal_type == AnimalType.CATTLE
    assert "fever" in [s.lower() for s in result.symptoms]


def test_hindi_animal_and_fever_extraction() -> None:
    service = SymptomExtractionService(extractor=RuleBasedSymptomExtractor())
    result = service.extract("Meri gai ko bukhar hai")
    assert result.animal_type == AnimalType.CATTLE
    assert "fever" in [s.lower() for s in result.symptoms]


def test_kannada_input_skips_which_animal_question() -> None:
    service = SymptomExtractionService(extractor=RuleBasedSymptomExtractor())
    orchestrator = ChatOrchestrator(symptom_extractor=service)
    result = orchestrator.process(
        "Nanna hasuvige jwara bandide",
        context_size=0,
        language="kn",
    )
    assert "Which animal is affected" not in result.reply


def test_static_translation_real_kannada_not_mock_prefix() -> None:
    async def _run() -> None:
        provider = StaticPhraseTranslationProvider()
        response = await provider.translate(
            TranslateRequest(
                text="I have a few questions to identify the disease.",
                target_language=TargetLanguage.KN,
            ),
        )
        assert response.translated_text.startswith("ರೋಗ")
        assert "[ಕನ್ನಡ]" not in response.translated_text

    asyncio.run(_run())


def test_localize_blocks_uses_static_phrases_without_mock_prefix() -> None:
    blocks = [
        AssistantBlock(
            message_type=MessageType.TEXT,
            content="I have a few questions to identify the disease.",
        ),
    ]
    service = TranslationService(
        provider=StaticPhraseTranslationProvider(),
    )
    import features.chat.utils.localization as loc

    original = loc.get_translation_service
    loc.get_translation_service = lambda: service
    try:
        localized = localize_blocks(blocks, "kn")
    finally:
        loc.get_translation_service = original

    assert localized[0].content.startswith("ರೋಗ")
    assert "[ಕನ್ನಡ]" not in localized[0].content


def test_conversation_state_sets_cattle_from_hasuvige() -> None:
    service = SymptomExtractionService(extractor=RuleBasedSymptomExtractor())
    state = ConversationState(language="kn")
    ConversationState._absorb_user_message(
        state,
        "Nanna hasuvige jwara bandide",
        service,
    )
    assert state.animal_type == "cattle"
    assert "fever" in [s.lower() for s in state.active_symptoms()]
