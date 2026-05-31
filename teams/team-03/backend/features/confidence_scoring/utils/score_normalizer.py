"""Backward-compatible re-exports; prefer symptom_normalizer."""

from features.confidence_scoring.utils.symptom_normalizer import (
    normalize_symptom,
    normalized_symptom_set,
    unique_disease_symptoms,
)

__all__ = [
    "normalize_symptom",
    "normalized_symptom_set",
    "unique_disease_symptoms",
]
