"""Groq-powered multilingual symptom extraction with rule-based fallback."""

from __future__ import annotations

import json
import logging
from typing import Any

from config.settings import settings
from features.chat.schemas.symptom_extraction import SymptomExtractionResult
from features.chat.services.symptom_extraction_service import (
    ANIMAL_RULES,
    DEFAULT_ANIMAL_TYPE,
    RuleBasedSymptomExtractor,
    SYMPTOM_RULES,
    SymptomExtractor,
    apply_suppression_rules,
)
from features.confidence_scoring.utils.symptom_normalizer import normalize_symptom
from features.rag.schemas.enums import AnimalType
from shared.llm.groq_client import GroqChatMessage, GroqClient, GroqClientError

logger = logging.getLogger(__name__)

CANONICAL_SYMPTOM_LABELS: tuple[str, ...] = tuple(
    dict.fromkeys(rule.canonical for rule in SYMPTOM_RULES)
)

SUPPORTED_ANIMAL_TYPES: tuple[str, ...] = tuple(
    rule.animal_type.value for rule in ANIMAL_RULES
) + (DEFAULT_ANIMAL_TYPE.value,)

# Map disease-KB / LLM variants to rule-based canonical labels used by retrieval.
_SYMPTOM_ALIASES: dict[str, str] = {
    "loss of appetite": "reduced appetite",
    "poor appetite": "reduced appetite",
    "off feed": "reduced appetite",
    "drop in milk yield": "reduced milk yield",
    "low milk": "reduced milk yield",
    "less milk": "reduced milk yield",
    "excessive salivation and drooling": "drooling",
    "excessive salivation": "drooling",
    "salivation": "drooling",
    "saliva": "drooling",
    "very high fever": "high fever",
    "running a fever": "high fever",
    "temperature": "fever",
    "hot to touch": "fever",
    "lame": "lameness and reluctance to walk",
    "lameness": "lameness and reluctance to walk",
    "runny nose": "nasal discharge",
}

_CANONICAL_BY_NORMALIZED: dict[str, str] = {
    normalize_symptom(label): label for label in CANONICAL_SYMPTOM_LABELS
}

SYSTEM_PROMPT = """You are a livestock health triage assistant for rural farmers in India.

Extract the animal species and clinical symptoms from the farmer message.
The message may be in English, Hindi, Kannada, Marathi, Tamil, Telugu, or mixed languages.

Return STRICT JSON only — no markdown, no commentary — with this exact shape:
{{
  "animal_type": "<one of: cattle, buffalo, goat, sheep, pig, poultry>",
  "symptoms": ["<canonical English symptom>", "..."]
}}

Rules:
- animal_type must be one of the supported values above; default to "cattle" if unclear.
- symptoms must use ONLY labels from this canonical list (exact wording):
  {symptom_labels}
- Translate non-English symptom descriptions into the closest canonical English labels.
- Include every symptom clearly implied by the message; omit vague statements.
- Do not invent symptoms not supported by the message.
- Return an empty symptoms array if no clinical signs are mentioned.
"""


def build_symptom_extraction_prompt(message: str) -> list[GroqChatMessage]:
    """Build Groq chat messages for symptom extraction."""
    symptom_list = "\n  ".join(f"- {label}" for label in CANONICAL_SYMPTOM_LABELS)
    system = SYSTEM_PROMPT.format(symptom_labels=symptom_list)
    return [
        GroqChatMessage(role="system", content=system),
        GroqChatMessage(role="user", content=message.strip()),
    ]


def parse_groq_extraction_payload(raw: str) -> SymptomExtractionResult:
    """Parse and validate Groq JSON output into a SymptomExtractionResult."""
    try:
        data: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise GroqClientError("Groq returned invalid JSON.") from exc

    if not isinstance(data, dict):
        raise GroqClientError("Groq JSON root must be an object.")

    animal_raw = data.get("animal_type", DEFAULT_ANIMAL_TYPE.value)
    if not isinstance(animal_raw, str):
        raise GroqClientError("animal_type must be a string.")
    animal_value = animal_raw.strip().lower()
    try:
        animal_type = AnimalType(animal_value)
    except ValueError as exc:
        raise GroqClientError(f"Unsupported animal_type: {animal_raw!r}") from exc

    symptoms_raw = data.get("symptoms", [])
    if symptoms_raw is None:
        symptoms_raw = []
    if not isinstance(symptoms_raw, list):
        raise GroqClientError("symptoms must be a list.")

    canonical_symptoms = canonicalize_groq_symptoms(symptoms_raw)
    return SymptomExtractionResult(
        animal_type=animal_type,
        symptoms=canonical_symptoms,
    )


def canonicalize_groq_symptoms(symptoms: list[Any]) -> list[str]:
    """Map Groq symptom strings to deduplicated canonical labels."""
    matched: list[str] = []
    seen: set[str] = set()

    for item in symptoms:
        if not isinstance(item, str):
            continue
        normalized = normalize_symptom(item)
        if not normalized:
            continue

        canonical = _CANONICAL_BY_NORMALIZED.get(normalized)
        if canonical is None:
            canonical = _SYMPTOM_ALIASES.get(normalized)
            if canonical is not None:
                canonical = _CANONICAL_BY_NORMALIZED.get(
                    normalize_symptom(canonical),
                    canonical,
                )

        if canonical is None:
            continue

        norm_canonical = normalize_symptom(canonical)
        if norm_canonical in seen:
            continue
        seen.add(norm_canonical)
        matched.append(canonical)

    return apply_suppression_rules(matched)


class GroqSymptomExtractor:
    """LLM-backed symptom extractor with deterministic rule-based fallback."""

    def __init__(
        self,
        *,
        groq_client: GroqClient | None = None,
        fallback: SymptomExtractor | None = None,
    ) -> None:
        self._fallback = fallback or RuleBasedSymptomExtractor()
        self._groq = groq_client

    def _get_groq_client(self) -> GroqClient:
        if self._groq is not None:
            return self._groq
        return GroqClient(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            max_tokens=settings.groq_max_tokens,
            temperature=min(settings.groq_temperature, 0.2),
        )

    def extract(self, message: str) -> SymptomExtractionResult:
        """Extract symptoms via Groq; fall back to rules on any failure."""
        if not message or not message.strip():
            return SymptomExtractionResult(
                animal_type=DEFAULT_ANIMAL_TYPE,
                symptoms=[],
            )

        try:
            client = self._get_groq_client()
            raw = client.chat_completion(build_symptom_extraction_prompt(message))
            return parse_groq_extraction_payload(raw)
        except GroqClientError as exc:
            logger.warning("Groq symptom extraction failed, using rule-based fallback: %s", exc)
            return self._fallback.extract(message)
        except Exception as exc:  # pragma: no cover - safety net
            logger.exception("Unexpected Groq symptom extraction error: %s", exc)
            return self._fallback.extract(message)
