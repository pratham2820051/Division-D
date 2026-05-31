import os

# Force lightweight providers during automated tests (no GPU / network required)
os.environ.setdefault("VOICE_STT_PROVIDER", "mock")
os.environ.setdefault("VOICE_TTS_PROVIDER", "mock")
os.environ.setdefault("TRANSLATION_PROVIDER", "mock")

import pytest
from fastapi.testclient import TestClient

from config.settings import settings
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
