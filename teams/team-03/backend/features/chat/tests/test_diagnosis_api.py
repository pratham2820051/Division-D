"""API tests for POST /api/v1/diagnose."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from features.chat.routes.diagnosis import get_diagnosis_orchestrator
from features.chat.schemas.diagnosis_response import DiagnosisResponse
from features.rag.schemas.disease import DiseaseMatch
from features.rag.schemas.enums import TriageSeverity
from features.rag.schemas.responses import TriageResult
from main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_dependency_overrides() -> None:
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def sample_diagnosis_response() -> DiagnosisResponse:
    return DiagnosisResponse(
        candidate_diseases=[
            DiseaseMatch(
                disease_id="fmd",
                disease_name="Foot and Mouth Disease",
                confidence_score=0.5,
                matched_symptoms=["high fever"],
                missing_symptoms=["drooling"],
            )
        ],
        followup_questions=[],
        triage_result=TriageResult(
            severity=TriageSeverity.URGENT,
            reason="Detected symptom: high fever",
        ),
        sms_alert=None,
        requires_more_information=False,
    )


def test_successful_diagnosis(
    client: TestClient,
    sample_diagnosis_response: DiagnosisResponse,
) -> None:
    mock_orchestrator = MagicMock()
    mock_orchestrator.diagnose.return_value = sample_diagnosis_response
    app.dependency_overrides[get_diagnosis_orchestrator] = lambda: mock_orchestrator

    response = client.post(
        "/api/v1/diagnose",
        json={
            "animal_type": "cattle",
            "symptoms": ["high fever", "drooling"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["candidate_diseases"][0]["disease_name"] == "Foot and Mouth Disease"
    assert body["triage_result"]["severity"] == "urgent"
    assert body["requires_more_information"] is False
    mock_orchestrator.diagnose.assert_called_once_with(
        animal_type="cattle",
        symptoms=["high fever", "drooling"],
    )


def test_invalid_request_missing_fields(client: TestClient) -> None:
    response = client.post("/api/v1/diagnose", json={"animal_type": "cattle"})

    assert response.status_code == 422
    assert "detail" in response.json()


def test_empty_symptoms_returns_validation_error(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnose",
        json={"animal_type": "cattle", "symptoms": []},
    )

    assert response.status_code == 422


def test_whitespace_only_symptoms_returns_validation_error(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnose",
        json={"animal_type": "cattle", "symptoms": ["   ", ""]},
    )

    assert response.status_code == 422


def test_unknown_animal_type_returns_validation_error(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnose",
        json={"animal_type": "elephant", "symptoms": ["high fever"]},
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any("animal_type" in str(error).lower() for error in detail)
