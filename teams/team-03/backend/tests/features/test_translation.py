"""Smoke tests for translation API."""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_translate_hindi():
    response = client.post(
        "/api/v1/translation/translate",
        json={"text": "Possible disease: FMD. Severity: Urgent.", "target_language": "hi"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "translated_text" in body
    assert body["target_language"] == "hi"
    assert len(body["translated_text"]) > 0


def test_translate_english_passthrough():
    response = client.post(
        "/api/v1/translation/translate",
        json={"text": "Hello farmer", "target_language": "en"},
    )
    assert response.status_code == 200
    assert response.json()["translated_text"] == "Hello farmer"
