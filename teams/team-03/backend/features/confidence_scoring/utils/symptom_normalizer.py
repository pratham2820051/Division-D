"""Symptom string normalization for confidence scoring."""

from __future__ import annotations

# Fallback equivalence groups when datasets are unavailable (tests, offline).
_SYMPTOM_EQUIVALENCE_GROUPS: tuple[frozenset[str], ...] = (
    frozenset(
        {
            "drooling",
            "excessive salivation",
            "excessive salivation and drooling",
        }
    ),
    frozenset(
        {
            "reduced appetite",
            "loss of appetite",
            "not eating",
            "off feed",
        }
    ),
    frozenset(
        {
            "firm skin nodules on neck and body",
            "skin nodules",
            "lumps on skin",
            "lumpy skin",
        }
    ),
    frozenset(
        {
            "blisters on tongue and gums",
            "mouth ulcers",
            "ulcers in mouth",
            "sores in mouth",
        }
    ),
    frozenset(
        {
            "lameness and reluctance to walk",
            "lameness",
            "walking problem",
        }
    ),
    frozenset(
        {
            "fever",
            "temperature",
            "hot to touch",
        }
    ),
    frozenset(
        {
            "high fever",
            "very high fever",
            "running a fever",
        }
    ),
    frozenset(
        {
            "weakness and lethargy",
            "animal weak",
            "looks weak",
            "very weak",
            "weak",
            "dull",
            "lethargic",
            "depression and isolation from herd",
        }
    ),
    frozenset(
        {
            "reduced milk yield",
            "low milk",
            "drop in milk yield",
            "milk reduced",
        }
    ),
)


def _active_equivalence_groups() -> tuple[frozenset[str], ...]:
    return _SYMPTOM_EQUIVALENCE_GROUPS


def normalize_symptom(symptom: str) -> str:
    """Lowercase and trim a single symptom label."""
    return symptom.strip().lower()


def expand_normalized_symptoms(symptoms: list[str]) -> set[str]:
    """Expand symptoms to all equivalent normalized forms for matching."""
    expanded: set[str] = set()
    groups = _active_equivalence_groups()
    for symptom in symptoms:
        normalized = normalize_symptom(symptom)
        if not normalized:
            continue
        expanded.add(normalized)
        for group in groups:
            if normalized in group:
                expanded.update(group)
    return expanded


def symptoms_overlap(user_symptom: str, disease_symptom: str) -> bool:
    """True when user-reported and disease symptoms are equivalent."""
    return bool(
        expand_normalized_symptoms([user_symptom])
        & expand_normalized_symptoms([disease_symptom])
    )


def normalized_symptom_set(symptoms: list[str]) -> set[str]:
    """Build a deduplicated set of normalized user-reported symptoms with aliases."""
    return expand_normalized_symptoms(symptoms)


def unique_disease_symptoms(symptoms: list[str]) -> list[str]:
    """
    Return disease symptoms deduplicated by normalized form, preserving first occurrence.

    Empty strings after normalization are omitted.
    """
    unique: list[str] = []
    seen: set[str] = set()
    for symptom in symptoms:
        normalized = normalize_symptom(symptom)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        unique.append(symptom.strip())
    return unique
