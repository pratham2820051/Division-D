"""Unit tests for Groq translation provider and provider selection."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from config.settings import settings
from features.translation.schemas.request import TargetLanguage, TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.groq_provider import GroqTranslationProvider
from features.translation.services.libretranslate_provider import LibreTranslateProvider
from features.translation.services.mock_provider import MockTranslationProvider
from features.translation.services.translation_service import _build_provider


@pytest.fixture
def mock_fallback():
    fallback = MockTranslationProvider()
    fallback.translate = AsyncMock(
        return_value=TranslateResponse(
            translated_text="[fallback]",
            source_language="en",
            target_language="kn",
        )
    )
    return fallback


@pytest.mark.asyncio
async def test_groq_passthrough_same_language():
    provider = GroqTranslationProvider(api_key="test-key")
    request = TranslateRequest(text="Hello farmer", target_language=TargetLanguage.EN)
    result = await provider.translate(request)
    assert result.translated_text == "Hello farmer"
    assert result.source_language == "en"
    assert result.target_language == "en"


@pytest.mark.asyncio
async def test_groq_missing_api_key_uses_fallback(mock_fallback):
    provider = GroqTranslationProvider(api_key="", fallback=mock_fallback)
    request = TranslateRequest(
        text="Possible disease: Mastitis",
        target_language=TargetLanguage.KN,
    )
    result = await provider.translate(request)
    assert result.translated_text == "[fallback]"
    mock_fallback.translate.assert_awaited_once()


@pytest.mark.asyncio
async def test_groq_unsupported_language_uses_fallback(mock_fallback):
    provider = GroqTranslationProvider(api_key="test-key", fallback=mock_fallback)
    request = TranslateRequest(
        text="Possible disease",
        target_language=TargetLanguage.ML,
    )
    result = await provider.translate(request)
    assert result.translated_text == "[fallback]"
    mock_fallback.translate.assert_awaited_once()


@pytest.mark.asyncio
async def test_groq_successful_translation(mock_fallback):
    provider = GroqTranslationProvider(api_key="test-key", fallback=mock_fallback)

    mock_message = MagicMock()
    mock_message.content = "ಸಂಭವನೀಯ ರೋಗ: ಮಾಸ್ಟಿಟಿಸ್"
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

    with patch("groq.AsyncGroq", return_value=mock_client):
        request = TranslateRequest(
            text="Possible disease: Mastitis",
            target_language=TargetLanguage.KN,
        )
        result = await provider.translate(request)

    assert result.translated_text == "ಸಂಭವನೀಯ ರೋಗ: ಮಾಸ್ಟಿಟಿಸ್"
    assert result.source_language == "en"
    assert result.target_language == "kn"
    mock_fallback.translate.assert_not_called()

    call_kwargs = mock_client.chat.completions.create.await_args.kwargs
    assert call_kwargs["model"] == provider._model
    system_content = call_kwargs["messages"][0]["content"]
    assert "veterinary" in system_content.lower()
    assert "livestock" in system_content.lower()


@pytest.mark.asyncio
async def test_groq_api_failure_uses_fallback(mock_fallback):
    provider = GroqTranslationProvider(api_key="test-key", fallback=mock_fallback)

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=RuntimeError("API down"))

    with patch("groq.AsyncGroq", return_value=mock_client):
        request = TranslateRequest(
            text="Severity: Urgent",
            target_language=TargetLanguage.HI,
        )
        result = await provider.translate(request)

    assert result.translated_text == "[fallback]"
    mock_fallback.translate.assert_awaited_once()


def test_build_provider_mock(monkeypatch):
    monkeypatch.setattr(settings, "translation_provider", "mock")
    assert isinstance(_build_provider(), MockTranslationProvider)


def test_build_provider_groq(monkeypatch):
    monkeypatch.setattr(settings, "translation_provider", "groq")
    monkeypatch.setattr(settings, "groq_api_key", "gsk-test")
    assert isinstance(_build_provider(), GroqTranslationProvider)


def test_build_provider_libretranslate(monkeypatch):
    monkeypatch.setattr(settings, "translation_provider", "libretranslate")
    assert isinstance(_build_provider(), LibreTranslateProvider)


def test_build_provider_auto_prefers_groq(monkeypatch):
    monkeypatch.setattr(settings, "translation_provider", "auto")
    monkeypatch.setattr(settings, "groq_api_key", "gsk-test")
    assert isinstance(_build_provider(), GroqTranslationProvider)


def test_build_provider_auto_falls_back_to_libretranslate(monkeypatch):
    monkeypatch.setattr(settings, "translation_provider", "auto")
    monkeypatch.setattr(settings, "groq_api_key", "")
    monkeypatch.setattr(settings, "libretranslate_url", "https://libretranslate.com")
    assert isinstance(_build_provider(), LibreTranslateProvider)


def test_build_provider_auto_uses_mock_when_no_backends(monkeypatch):
    monkeypatch.setattr(settings, "translation_provider", "auto")
    monkeypatch.setattr(settings, "groq_api_key", "")
    monkeypatch.setattr(settings, "libretranslate_url", "")
    assert isinstance(_build_provider(), MockTranslationProvider)
