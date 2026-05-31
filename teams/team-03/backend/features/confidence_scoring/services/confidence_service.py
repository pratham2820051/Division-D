"""Symptom overlap confidence scoring against disease profiles."""

from __future__ import annotations

from features.confidence_scoring.utils.confidence_explanation import build_confidence_reason
from features.confidence_scoring.utils.symptom_normalizer import (
    expand_normalized_symptoms,
    symptoms_overlap,
    unique_disease_symptoms,
)
from features.rag.repositories.disease_repository import DiseaseRepository
from features.rag.schemas.disease import Disease, DiseaseMatch


class ConfidenceScoringService:
    """Score how well reported symptoms align with a disease knowledge record."""

    def __init__(self, repository: DiseaseRepository | None = None) -> None:
        self._repository = repository

    def score_disease(
        self,
        user_symptoms: list[str],
        disease: Disease,
        *,
        rejected_symptoms: list[str] | None = None,
    ) -> DiseaseMatch:
        """Compute confidence and symptom overlap for one disease."""
        rejected = rejected_symptoms or []
        weights = self._weights_for_disease(disease.disease_id)
        if weights and self._repository is not None:
            return self._score_weighted(user_symptoms, disease, weights, rejected=rejected)

        matched, missing = self._partition_symptoms(user_symptoms, disease.symptoms)
        contradicted = self._partition_contradicted(rejected, disease.symptoms, matched)
        confidence = self._evidence_confidence(
            matched_count=len(matched),
            missing_count=len(missing),
            contradicted_count=len(contradicted),
        )

        match = DiseaseMatch(
            disease_id=disease.disease_id,
            disease_name=disease.disease_name,
            confidence_score=confidence,
            matched_symptoms=matched,
            missing_symptoms=missing,
            contradicted_symptoms=contradicted,
        )
        return match.model_copy(update={"confidence_reason": build_confidence_reason(match)})

    def score_multiple_diseases(
        self,
        user_symptoms: list[str],
        diseases: list[Disease],
        *,
        rejected_symptoms: list[str] | None = None,
    ) -> list[DiseaseMatch]:
        """Score all diseases and return matches sorted by confidence (descending)."""
        results = [
            self.score_disease(user_symptoms, disease, rejected_symptoms=rejected_symptoms)
            for disease in diseases
        ]
        return sorted(
            results,
            key=lambda match: (match.confidence_score, match.disease_name),
            reverse=True,
        )

    def _weights_for_disease(self, disease_id: str) -> dict[str, float]:
        if self._repository is None:
            return {}
        try:
            self._repository.ensure_loaded()
            return self._repository.get_symptom_weights(disease_id)
        except Exception:
            return {}

    def _score_weighted(
        self,
        user_symptoms: list[str],
        disease: Disease,
        weights: dict[str, float],
        *,
        rejected: list[str],
    ) -> DiseaseMatch:
        user_expanded = expand_normalized_symptoms(user_symptoms)
        rejected_expanded = expand_normalized_symptoms(rejected)
        matched: list[str] = []
        missing: list[str] = []
        contradicted: list[str] = []
        matched_weight = 0.0
        contradicted_weight = 0.0
        missing_weight = 0.0

        for symptom_id, weight in sorted(weights.items(), key=lambda item: (-item[1], item[0])):
            symptom = self._repository.get_symptom(symptom_id)
            if symptom is None:
                continue

            canonical = symptom.canonical_name
            forms = self._repository.expand_symptom_forms(symptom_id)

            if rejected_expanded & forms or self._repository.symptom_matches_report(
                rejected,
                symptom_id,
                user_expanded=rejected_expanded,
            ):
                contradicted.append(canonical)
                contradicted_weight += weight
                continue

            if self._repository.symptom_matches_report(
                user_symptoms,
                symptom_id,
                user_expanded=user_expanded,
            ):
                matched.append(canonical)
                matched_weight += weight
            else:
                missing.append(canonical)
                missing_weight += weight

        confidence = self._weighted_evidence_confidence(
            matched_weight=matched_weight,
            contradicted_weight=contradicted_weight,
            missing_weight=missing_weight,
        )
        match = DiseaseMatch(
            disease_id=disease.disease_id,
            disease_name=disease.disease_name,
            confidence_score=confidence,
            matched_symptoms=matched,
            missing_symptoms=missing,
            contradicted_symptoms=contradicted,
        )
        return match.model_copy(update={"confidence_reason": build_confidence_reason(match)})

    @staticmethod
    def _partition_symptoms(
        user_symptoms: list[str],
        disease_symptoms: list[str],
    ) -> tuple[list[str], list[str]]:
        matched: list[str] = []
        missing: list[str] = []

        for symptom in unique_disease_symptoms(disease_symptoms):
            if any(
                symptoms_overlap(reported, symptom) for reported in user_symptoms
            ):
                matched.append(symptom)
            else:
                missing.append(symptom)

        return matched, missing

    @staticmethod
    def _partition_contradicted(
        rejected_symptoms: list[str],
        disease_symptoms: list[str],
        matched_symptoms: list[str],
    ) -> list[str]:
        if not rejected_symptoms:
            return []
        matched_keys = expand_normalized_symptoms(matched_symptoms)
        contradicted: list[str] = []
        for symptom in unique_disease_symptoms(disease_symptoms):
            symptom_keys = expand_normalized_symptoms([symptom])
            if symptom_keys & matched_keys:
                continue
            if any(
                symptoms_overlap(rejected, symptom) for rejected in rejected_symptoms
            ):
                contradicted.append(symptom)
        return contradicted

    @staticmethod
    def _evidence_confidence(
        *,
        matched_count: int,
        missing_count: int,
        contradicted_count: int,
    ) -> float:
        if matched_count <= 0:
            return 0.0
        if contradicted_count > 0:
            denominator = matched_count + missing_count + (contradicted_count * 1.5)
        else:
            denominator = matched_count + missing_count
        if denominator <= 0:
            return 0.0
        return min(1.0, matched_count / denominator)

    @staticmethod
    def _weighted_evidence_confidence(
        *,
        matched_weight: float,
        contradicted_weight: float,
        missing_weight: float,
    ) -> float:
        if matched_weight <= 0:
            return 0.0
        if contradicted_weight > 0:
            denominator = matched_weight + missing_weight + (contradicted_weight * 1.5)
        else:
            denominator = matched_weight + missing_weight
        if denominator <= 0:
            return 0.0
        return min(1.0, matched_weight / denominator)
