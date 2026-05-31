"""Multilingual conversation pipeline validation tests."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.chat.schemas.messages import AssistantBlock, MessageType
from features.chat.schemas.request import VoiceInputMetadata
from features.chat.services.chat_service import ChatService
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.utils.conversation_language import resolve_conversation_language
from features.chat.utils.diagnosis_flow import VOICE_UNCLEAR_TEXT
from features.chat.utils.domain_classifier import DOMAIN_GUARDRAIL_TEXT
from features.chat.utils.farmer_messages import farmer_message, localize_system_message
from features.chat.utils.localization import localize_blocks
from features.translation.services.static_translation_provider import (
    StaticPhraseTranslationProvider,
)
from features.translation.services.translation_service import TranslationService
from features.voice.services.tts_service import EDGE_VOICE_BY_LANGUAGE, EdgeTTSProvider


@pytest.mark.parametrize(
    ("user", "detected", "expected"),
    [
        ("kn", "hi", "kn"),
        ("", "hi", "hi"),
        (None, "kn", "kn"),
        ("en", None, "en"),
        (None, None, "en"),
    ],
)
def test_resolve_conversation_language_priority(
    user: str | None,
    detected: str | None,
    expected: str,
) -> None:
    assert resolve_conversation_language(user, detected) == expected


def test_resolve_conversation_language_text_inference() -> None:
    assert (
        resolve_conversation_language(
            "en",
            message_text="Nanna hasuvige jwara bandide",
        )
        == "kn"
    )


@pytest.mark.parametrize(
    ("language", "snippet"),
    [
        ("kn", "ಆಡಿಯೋ"),
        ("hi", "ऑडियो"),
        ("en", "could not clearly understand"),
    ],
)
def test_farmer_voice_unclear_message(language: str, snippet: str) -> None:
    text = farmer_message("voice_unclear", language)
    assert snippet.lower() in text.lower()
    assert "[" not in text


@pytest.mark.parametrize(
    ("language", "snippet"),
    [
        ("kn", "ಪಶು"),
        ("hi", "पशु"),
        ("en", "livestock health"),
    ],
)
def test_farmer_domain_guardrail(language: str, snippet: str) -> None:
    text = farmer_message("domain_guardrail", language)
    assert snippet.lower() in text.lower()


def test_localize_system_message_skips_translation_api() -> None:
    localized = localize_system_message(VOICE_UNCLEAR_TEXT, "kn")
    assert localized != VOICE_UNCLEAR_TEXT
    assert "ಆಡಿಯೋ" in localized


def test_localize_blocks_translates_disease_symptoms() -> None:
    blocks = [
        AssistantBlock(
            message_type=MessageType.DISEASE_ANALYSIS,
            content="Disease analysis",
            payload={
                "diseases": [
                    {
                        "name": "Foot and Mouth Disease",
                        "confidence": 80,
                        "matched_symptoms": ["fever", "drooling"],
                        "missing_symptoms": ["hoof lesions"],
                    },
                ],
                "severity": "urgent",
            },
        ),
    ]

    static = StaticPhraseTranslationProvider()
    service = TranslationService(provider=static)
    import features.chat.utils.localization as loc

    original = loc.get_translation_service
    loc.get_translation_service = lambda: service
    try:
        localized = localize_blocks(blocks, "kn")
    finally:
        loc.get_translation_service = original

    assert localized[0].content == "ರೋಗ ವಿಶ್ಲೇಷಣೆ"
    assert "[ಕನ್ನಡ]" not in localized[0].content
    disease = localized[0].payload["diseases"][0]
    assert disease["name"] == "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ"


@pytest.mark.parametrize(
    ("language", "voice"),
    [
        ("en", "en-IN-NeerjaNeural"),
        ("hi", "hi-IN-SwaraNeural"),
        ("kn", "kn-IN-SapnaNeural"),
    ],
)
def test_edge_tts_voice_per_language(language: str, voice: str) -> None:
    provider = EdgeTTSProvider()
    assert provider._resolve_voice(language) == voice
    assert EDGE_VOICE_BY_LANGUAGE[language] == voice


def test_kannada_voice_unclear_end_to_end_localization() -> None:
    orchestrator = ChatOrchestrator()
    raw = orchestrator.process(
        "random noise",
        context_size=0,
        language="kn",
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=0.1,
            language_confidence=0.9,
            requested_language="kn",
            detected_language="kn",
            fallback_used=False,
        ),
    )
    assert VOICE_UNCLEAR_TEXT in raw.reply

    localized = localize_blocks(raw.blocks, "kn")
    assert "ಆಡಿಯೋ" in localized[0].content
    assert localized[0].content != VOICE_UNCLEAR_TEXT


def test_english_voice_keeps_english_reply() -> None:
    orchestrator = ChatOrchestrator()
    raw = orchestrator.process(
        "noise",
        context_size=0,
        language="en",
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=0.1,
            language_confidence=0.9,
            requested_language="en",
            detected_language="en",
            fallback_used=False,
        ),
    )
    localized = localize_blocks(raw.blocks, "en")
    assert localized[0].content == VOICE_UNCLEAR_TEXT


def test_guardrail_localized_for_hindi() -> None:
    orchestrator = ChatOrchestrator()
    raw = orchestrator.process("who won the IPL match", context_size=0, language="hi")
    assert DOMAIN_GUARDRAIL_TEXT in raw.reply
    localized = localize_blocks(raw.blocks, "hi")
    assert "पशु" in localized[0].content


def test_chat_service_returns_resolved_language() -> None:
    memory = MagicMock()
    user_msg = MagicMock()
    assistant_msg = MagicMock()
    memory.add_message.side_effect = [user_msg, assistant_msg]
    memory.get_recent_context.return_value = []

    service = ChatService(memory=memory)
    with patch(
        "features.chat.services.chat_service.chat_orchestrator.process",
        return_value=MagicMock(
            blocks=[
                AssistantBlock(
                    message_type=MessageType.TEXT,
                    content=VOICE_UNCLEAR_TEXT,
                ),
            ],
            reply=VOICE_UNCLEAR_TEXT,
            severity=None,
            confidence=0.0,
            disease=None,
            first_aid=None,
            follow_up_question=None,
        ),
    ):
        with patch(
            "features.chat.services.chat_service.localize_blocks",
            side_effect=lambda blocks, _lang: blocks,
        ):
            result = service.send_message(
                "chat-1",
                "test",
                language="kn",
                voice_metadata=VoiceInputMetadata(
                    transcription_confidence=0.2,
                    language_confidence=0.9,
                    requested_language="kn",
                    detected_language="kn",
                    fallback_used=False,
                ),
            )

    assert result["language"] == "kn"


def test_edge_tts_selected_voice_for_kannada() -> None:
    async def _run() -> None:
        provider = EdgeTTSProvider()
        with patch.object(
            provider,
            "_synthesize_edge",
            new=AsyncMock(return_value=b"audio"),
        ):
            result = await provider.synthesize("ಹಸುವಿಗೆ ಜ್ವರ", language="kn")

        assert result.voice == "kn-IN-SapnaNeural"
        assert result.language == "kn"

    asyncio.run(_run())
