"""Smoke tests for voice API."""

import io
import wave

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _minimal_wav() -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(b"\x00\x00" * 1600)
    return buffer.getvalue()


def test_transcribe():
    wav = _minimal_wav()
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("test.wav", wav, "audio/wav")},
        data={"language": "en"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "text" in body
    assert len(body["text"]) > 0
    assert body["language"] == "en"
    assert "provider" in body
    assert "fallback_used" in body


def test_transcribe_kannada_language_hint():
    wav = _minimal_wav()
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("test.wav", wav, "audio/wav")},
        data={"language": "kn"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "kn"
    assert body["requested_language"] == "kn"


def test_speak():
    response = client.post(
        "/api/v1/voice/speak",
        json={"text": "Your cow needs rest and water.", "language": "en"},
    )
    assert response.status_code == 200
    content_type = response.headers["content-type"]
    assert content_type in ("audio/wav", "audio/mpeg", "audio/mp3")
    assert len(response.content) > 44
