"""Confidence score explanations (no upward layer imports)."""

from __future__ import annotations

from typing import Protocol


class _MatchLike(Protocol):
    disease_name: str
    matched_symptoms: list[str]
    missing_symptoms: list[str]
    contradicted_symptoms: list[str]


def build_confidence_reason(match: _MatchLike) -> str:
    """One-line explanation of why the confidence score looks the way it does."""
    matched = match.matched_symptoms
    contradicted = getattr(match, "contradicted_symptoms", []) or []
    missing = match.missing_symptoms

    if contradicted:
        return (
            f"Partial match for {match.disease_name}; "
            f"some expected signs were ruled out ({', '.join(contradicted[:2])})."
        )
    if len(matched) >= 3:
        return f"Strong match with {match.disease_name} pattern."
    if len(matched) >= 2:
        return f"Moderate match with {match.disease_name}; a few key signs still unconfirmed."
    if matched:
        return (
            f"Early match with {match.disease_name} based on "
            f"{matched[0]}; more distinguishing signs are still needed."
        )
    if missing:
        return f"Only general overlap; key {match.disease_name} signs not confirmed yet."
    return f"Insufficient evidence for {match.disease_name}."
