"""Sarvam STT provider and fallback chain tests."""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from features.chat.schemas.request import VoiceInputMetadata
from features.chat.services.orchestrator import ChatOrchestrator
from features.chat.utils.diagnosis_flow import VOICE_TRANSCRIPTION_MIN_CONFIDENCE, VOICE_UNCLEAR_TEXT
from features.voice.services.base import STTProviderError, TranscriptionResult
from features.voice.services.mock_stt import MockSpeechToTextProvider
from features.voice.services.sarvam_stt_provider import (
    SarvamSTTError,
    SarvamSTTProvider,
    SarvamSTTTimeoutError,
)
from features.voice.services.stt_chain import ChainedSTTProvider

_SAMPLE_AUDIO = b"\x00" * 512


@pytest.fixture
def sarvam_success_response() -> dict:
    return {
        "request_id": "req-1",
        "transcript": "My cow has fever since yesterday",
        "language_code": "en-IN",
        "language_probability": 0.93,
    }


def test_sarvam_success_maps_language_and_confidence(sarvam_success_response: dict) -> None:
    async def _run() -> None:
        provider = SarvamSTTProvider(api_key="test-key")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = sarvam_success_response

        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("features.voice.services.sarvam_stt_provider.httpx.AsyncClient", return_value=mock_client):
            result = await provider.transcribe(b"audio", filename="clip.webm", language="en")

        assert result.provider == "sarvam"
        assert result.fallback_used is False
        assert result.text == "My cow has fever since yesterday"
        assert result.language == "en"
        assert result.detected_language == "en"
        assert result.confidence >= 0.9
        assert result.language_confidence == 0.93

    asyncio.run(_run())


def test_sarvam_timeout_raises() -> None:
    async def _run() -> None:
        provider = SarvamSTTProvider(api_key="test-key", timeout_seconds=1.0)

        mock_client = AsyncMock()
        mock_client.post = AsyncMock(side_effect=httpx.TimeoutException("timeout"))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("features.voice.services.sarvam_stt_provider.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(SarvamSTTTimeoutError):
                await provider.transcribe(b"audio", language="kn")

    asyncio.run(_run())


def test_sarvam_missing_api_key_raises() -> None:
    async def _run() -> None:
        provider = SarvamSTTProvider(api_key="")
        with pytest.raises(SarvamSTTError):
            await provider.transcribe(b"audio", language="hi")

    asyncio.run(_run())


def test_whisper_fallback_in_chain() -> None:
    async def _run() -> None:
        failing_sarvam = AsyncMock()
        failing_sarvam.transcribe = AsyncMock(side_effect=SarvamSTTError("api down"))

        whisper_result = TranscriptionResult(
            text="cow fever",
            language="en",
            confidence=0.8,
            language_confidence=0.8,
            provider="faster-whisper",
        )
        whisper = AsyncMock()
        whisper.transcribe = AsyncMock(return_value=whisper_result)

        chain = ChainedSTTProvider([("sarvam", failing_sarvam), ("faster-whisper", whisper)])
        result = await chain.transcribe(_SAMPLE_AUDIO, language="en")

        assert result.text == "cow fever"
        assert result.provider == "faster-whisper"
        assert result.fallback_used is True

    asyncio.run(_run())


def test_empty_sarvam_transcript_falls_back_to_next_provider() -> None:
    async def _run() -> None:
        empty_sarvam = AsyncMock()
        empty_sarvam.transcribe = AsyncMock(
            return_value=TranscriptionResult(
                text="",
                language="en",
                confidence=0.0,
                provider="sarvam",
            ),
        )
        whisper_result = TranscriptionResult(
            text="goat has fever",
            language="en",
            confidence=0.82,
            language_confidence=0.82,
            provider="faster-whisper",
        )
        whisper = AsyncMock()
        whisper.transcribe = AsyncMock(return_value=whisper_result)

        chain = ChainedSTTProvider(
            [("sarvam", empty_sarvam), ("faster-whisper", whisper)],
        )
        result = await chain.transcribe(_SAMPLE_AUDIO, language="en")

        assert result.text == "goat has fever"
        assert result.fallback_used is True
        whisper.transcribe.assert_awaited_once()

    asyncio.run(_run())


def test_mock_fallback_after_whisper_failure() -> None:
    async def _run() -> None:
        failing_whisper = AsyncMock()
        failing_whisper.transcribe = AsyncMock(
            side_effect=STTProviderError("decode failed"),
        )
        mock = MockSpeechToTextProvider()

        chain = ChainedSTTProvider(
            [("faster-whisper", failing_whisper)],
            mock_fallback=mock,
        )
        result = await chain.transcribe(_SAMPLE_AUDIO, language="kn")

        assert result.provider == "mock"
        assert result.fallback_used is True
        assert result.language == "kn"

    asyncio.run(_run())


def test_low_confidence_transcript_blocked_by_chat_orchestrator() -> None:
    orchestrator = ChatOrchestrator()
    result = orchestrator.process(
        "random noise words",
        context_size=0,
        voice_metadata=VoiceInputMetadata(
            transcription_confidence=VOICE_TRANSCRIPTION_MIN_CONFIDENCE - 0.1,
            language_confidence=0.9,
            requested_language="en",
            detected_language="en",
            fallback_used=False,
        ),
    )

    assert VOICE_UNCLEAR_TEXT in result.reply
    assert result.disease is None


@pytest.mark.parametrize("language,sarvam_code", [("en", "en-IN"), ("hi", "hi-IN"), ("kn", "kn-IN")])
def test_sarvam_sends_language_code_and_saarika_for_ui_language(
    language: str,
    sarvam_code: str,
) -> None:
    async def _run() -> None:
        provider = SarvamSTTProvider(api_key="test-key", model="saaras:v3")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "request_id": "req-2",
            "transcript": "sample",
            "language_code": sarvam_code,
            "language_probability": None,
        }

        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("features.voice.services.sarvam_stt_provider.httpx.AsyncClient", return_value=mock_client):
            result = await provider.transcribe(b"audio", filename="clip.webm", language=language)

        _, kwargs = mock_client.post.call_args
        assert kwargs["data"]["language_code"] == sarvam_code
        assert kwargs["data"]["model"] == "saarika:v2.5"
        assert kwargs["data"]["input_audio_codec"] == "webm"
        assert result.language == language
        assert result.requested_language == language

    asyncio.run(_run())


def test_kannada_result_stays_kannada_when_sarvam_detects_hindi() -> None:
    async def _run() -> None:
        provider = SarvamSTTProvider(api_key="test-key")
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "request_id": "req-kn",
            "transcript": "ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ ಇದೆ",
            "language_code": "hi-IN",
            "language_probability": 0.91,
        }

        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("features.voice.services.sarvam_stt_provider.httpx.AsyncClient", return_value=mock_client):
            result = await provider.transcribe(b"audio", language="kn")

        assert result.language == "kn"
        assert result.requested_language == "kn"
        assert result.detected_language == "kn"

    asyncio.run(_run())
