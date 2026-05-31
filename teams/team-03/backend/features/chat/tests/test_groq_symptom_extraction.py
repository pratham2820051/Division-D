"""Unit tests for Groq-powered symptom extraction."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import httpx
import pytest

from config.settings import settings
from features.chat.schemas.symptom_extraction import SymptomExtractionResult
from features.chat.services.groq_symptom_extractor import (
    GroqSymptomExtractor,
    canonicalize_groq_symptoms,
    parse_groq_extraction_payload,
)
from features.chat.services.symptom_extraction_service import (
    RuleBasedSymptomExtractor,
    SymptomExtractionService,
    create_default_extractor,
)
from features.rag.schemas.enums import AnimalType
from shared.llm.groq_client import GroqClient, GroqClientError


@pytest.fixture
def rule_fallback() -> RuleBasedSymptomExtractor:
    return RuleBasedSymptomExtractor()


@pytest.fixture
def mock_groq_client() -> MagicMock:
    client = MagicMock(spec=GroqClient)
    return client


@pytest.fixture
def groq_extractor(
    mock_groq_client: MagicMock,
    rule_fallback: RuleBasedSymptomExtractor,
) -> GroqSymptomExtractor:
    return GroqSymptomExtractor(
        groq_client=mock_groq_client,
        fallback=rule_fallback,
    )


def _groq_json(animal_type: str, symptoms: list[str]) -> str:
    return json.dumps({"animal_type": animal_type, "symptoms": symptoms})


def test_english_symptoms_via_groq(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    mock_groq_client.chat_completion.return_value = _groq_json(
        "cattle",
        ["fever", "drooling"],
    )

    result = groq_extractor.extract("My cow has fever and is drooling")

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == ["fever", "drooling"]
    mock_groq_client.chat_completion.assert_called_once()


def test_kannada_symptoms_via_groq(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    kannada_message = "ನನ್ನ ಹಸುವಿಗೆ ಜ್ವರ ಇದೆ ಮತ್ತು ಬಾಯಿ ನೀರು ಬರುತ್ತಿದೆ"
    mock_groq_client.chat_completion.return_value = _groq_json(
        "cattle",
        ["fever", "drooling"],
    )

    result = groq_extractor.extract(kannada_message)

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == ["fever", "drooling"]
    user_message = mock_groq_client.chat_completion.call_args[0][0][1].content
    assert user_message == kannada_message


def test_hindi_symptoms_via_groq(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    hindi_message = "मेरी गाय को बुखार है और मुंह से लार आ रही है"
    mock_groq_client.chat_completion.return_value = _groq_json(
        "cattle",
        ["fever", "drooling"],
    )

    result = groq_extractor.extract(hindi_message)

    assert result.animal_type == AnimalType.CATTLE
    assert "fever" in result.symptoms
    assert "drooling" in result.symptoms


def test_malformed_json_falls_back_to_rules(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    mock_groq_client.chat_completion.return_value = "not valid json {"

    result = groq_extractor.extract("My cow has high fever and is drooling.")

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == ["high fever", "drooling"]


def test_groq_timeout_falls_back_to_rules(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    mock_groq_client.chat_completion.side_effect = GroqClientError(
        "Groq request timed out."
    )

    result = groq_extractor.extract("Cow has fever and drooling")

    assert result.animal_type == AnimalType.CATTLE
    assert "fever" in result.symptoms
    assert "drooling" in result.symptoms


def test_groq_api_error_falls_back_to_rules(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    mock_groq_client.chat_completion.side_effect = GroqClientError(
        "Groq API error (401): unauthorized"
    )

    result = groq_extractor.extract("Buffalo has fever")

    assert result.animal_type == AnimalType.BUFFALO
    assert result.symptoms == ["fever"]


def test_invalid_animal_type_in_json_falls_back(
    groq_extractor: GroqSymptomExtractor,
    mock_groq_client: MagicMock,
) -> None:
    mock_groq_client.chat_completion.return_value = _groq_json(
        "elephant",
        ["fever"],
    )

    result = groq_extractor.extract("My cow has fever")

    assert result.animal_type == AnimalType.CATTLE
    assert "fever" in result.symptoms


def test_unknown_symptoms_are_filtered() -> None:
    payload = parse_groq_extraction_payload(
        _groq_json("cattle", ["fever", "magic sparkle disease", "drooling"])
    )

    assert payload.symptoms == ["fever", "drooling"]


def test_symptom_aliases_are_canonicalized() -> None:
    symptoms = canonicalize_groq_symptoms(
        ["loss of appetite", "drop in milk yield", "excessive salivation and drooling"]
    )

    assert symptoms == ["reduced appetite", "reduced milk yield", "drooling"]


def test_high_fever_suppresses_fever() -> None:
    payload = parse_groq_extraction_payload(
        _groq_json("cattle", ["high fever", "fever"])
    )

    assert payload.symptoms == ["high fever"]


def test_empty_message_returns_defaults(groq_extractor: GroqSymptomExtractor) -> None:
    result = groq_extractor.extract("   ")

    assert result.animal_type == AnimalType.CATTLE
    assert result.symptoms == []


def test_use_groq_extraction_false_uses_rule_based() -> None:
    with patch.object(settings, "use_groq_extraction", False):
        extractor = create_default_extractor()

    assert isinstance(extractor, RuleBasedSymptomExtractor)


def test_use_groq_extraction_true_uses_groq() -> None:
    with patch.object(settings, "use_groq_extraction", True):
        extractor = create_default_extractor()

    assert isinstance(extractor, GroqSymptomExtractor)


def test_service_default_respects_config_flag() -> None:
    with patch.object(settings, "use_groq_extraction", False):
        service = SymptomExtractionService()

    result = service.extract("My cow has high fever and is drooling.")
    assert result.symptoms == ["high fever", "drooling"]


def test_groq_client_requires_api_key() -> None:
    with pytest.raises(GroqClientError, match="GROQ_API_KEY"):
        GroqClient(api_key="")


def test_groq_client_http_timeout_raises() -> None:
    mock_http = MagicMock()
    mock_http.post.side_effect = httpx.TimeoutException("timed out")

    client = GroqClient(api_key="test-key", http_client=mock_http)

    with pytest.raises(GroqClientError, match="timed out"):
        client.chat_completion([])
