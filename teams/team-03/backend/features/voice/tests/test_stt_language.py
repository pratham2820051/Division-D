"""Voice STT provider and language metadata tests."""

from __future__ import annotations

import asyncio

import pytest

from features.voice.services.mock_stt import MockSpeechToTextProvider


@pytest.mark.parametrize("language", ["en", "kn"])
def test_mock_stt_returns_requested_language(language: str) -> None:
    async def _run() -> None:
        provider = MockSpeechToTextProvider()
        result = await provider.transcribe(b"audio-bytes", language=language)
        assert result.language == language
        assert result.requested_language == language
        assert result.provider == "mock"
        assert result.fallback_used is False
        assert len(result.text) > 0

    asyncio.run(_run())


def test_mock_stt_kannada_not_english() -> None:
    async def _run() -> None:
        provider = MockSpeechToTextProvider()
        kn = await provider.transcribe(b"audio", language="kn")
        en = await provider.transcribe(b"audio", language="en")
        assert kn.language == "kn"
        assert en.language == "en"
        assert kn.text != en.text or kn.language != en.language

    asyncio.run(_run())
