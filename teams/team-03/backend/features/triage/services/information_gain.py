"""Rank diagnostic questions by expected uncertainty reduction."""

from __future__ import annotations

from features.confidence_scoring.utils.symptom_normalizer import normalize_symptom
from features.rag.repositories.disease_repository import DiseaseRepository
from features.rag.schemas.disease import DiseaseMatch


def symptom_weight_for_disease(
    repository: DiseaseRepository,
    disease_id: str,
    symptom_id: str,
) -> float:
    weights = repository.get_symptom_weights(disease_id)
    return weights.get(symptom_id, 0.0)


def resolve_symptom_id(repository: DiseaseRepository, symptom_label: str | None) -> str | None:
    if not symptom_label or not symptom_label.strip():
        return None
    symptom_id = repository.resolve_symptom_id(symptom_label)
    if symptom_id:
        return symptom_id
    return normalize_symptom(symptom_label).replace(" ", "_")


def information_gain_for_symptom(
    *,
    symptom_id: str,
    candidate_matches: list[DiseaseMatch],
    repository: DiseaseRepository,
    high_value_threshold: float = 0.85,
) -> float:
    """
    Estimate how much asking about ``symptom_id`` reduces diagnostic uncertainty.

    Higher when the symptom is discriminative (present in some candidates, absent in
    others) and carries high weight in the disease profile.
    """
    if not candidate_matches or not symptom_id:
        return 0.0

    disease_ids = [match.disease_id for match in candidate_matches[:5]]
    weights = [
        symptom_weight_for_disease(repository, disease_id, symptom_id)
        for disease_id in disease_ids
    ]
    carriers = sum(1 for weight in weights if weight > 0)
    if carriers == 0:
        return 0.0

    max_weight = max(weights)
    carrier_ratio = carriers / len(disease_ids)
    # Peak discrimination when roughly half of candidates share the symptom.
    discrimination = 4.0 * carrier_ratio * (1.0 - carrier_ratio)
    high_value_bonus = 1.0 if max_weight >= high_value_threshold else max_weight

    critical_bonus = 0.0
    record = repository.get_symptom(symptom_id)
    if record and (record.triage_tier or "").lower() == "critical":
        critical_bonus = 0.75

    top_gap = 0.0
    if len(candidate_matches) >= 2:
        top_gap = max(
            0.0,
            candidate_matches[0].confidence_score - candidate_matches[1].confidence_score,
        )

    return (max_weight * 2.0) + (discrimination * 0.75) + (high_value_bonus * 0.5) + top_gap + critical_bonus


def rank_symptom_ids_by_gain(
    symptom_ids: list[str],
    *,
    candidate_matches: list[DiseaseMatch],
    repository: DiseaseRepository,
) -> list[str]:
    """Return symptom IDs sorted by descending information gain."""
    scored = [
        (
            information_gain_for_symptom(
                symptom_id=symptom_id,
                candidate_matches=candidate_matches,
                repository=repository,
            ),
            symptom_id,
        )
        for symptom_id in symptom_ids
    ]
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [symptom_id for _, symptom_id in scored]
