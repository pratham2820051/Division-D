"""Rule-based livestock case severity classification."""

from __future__ import annotations

from features.confidence_scoring.utils.symptom_normalizer import normalize_symptom
from features.rag.repositories.disease_repository import DiseaseRepository, get_default_repository
from features.rag.schemas.enums import TriageSeverity
from features.rag.schemas.responses import TriageResult

_SELF_TREATABLE_REASON = (
    "No critical or urgent symptoms detected in the reported case. "
    "Monitor the animal and consult a veterinarian if condition worsens."
)


class TriageService:
    """Classify cases into self-treatable, urgent, or critical severity tiers."""

    def __init__(self, repository: DiseaseRepository | None = None) -> None:
        self._repository = repository or get_default_repository()

    def classify(self, symptoms: list[str]) -> TriageResult:
        """
        Classify observed symptoms using dataset triage tiers.

        Critical symptoms take precedence over urgent symptoms.
        """
        reported = self._normalized_reported_symptoms(symptoms)
        self._repository.ensure_loaded()

        critical_symptoms = self._repository.get_triage_symptoms("critical")
        critical_match = self._first_matching_symptom(critical_symptoms, reported)
        if critical_match is not None:
            return TriageResult(
                severity=TriageSeverity.CRITICAL,
                reason=f"Detected symptom: {critical_match}",
            )

        urgent_symptoms = self._repository.get_triage_symptoms("urgent")
        urgent_match = self._first_matching_symptom(urgent_symptoms, reported)
        if urgent_match is not None:
            return TriageResult(
                severity=TriageSeverity.URGENT,
                reason=f"Detected symptom: {urgent_match}",
            )

        return TriageResult(
            severity=TriageSeverity.SELF_TREATABLE,
            reason=_SELF_TREATABLE_REASON,
        )

    @staticmethod
    def _normalized_reported_symptoms(symptoms: list[str]) -> set[str]:
        from features.confidence_scoring.utils.symptom_normalizer import (
            expand_normalized_symptoms,
        )

        return expand_normalized_symptoms(symptoms)

    @staticmethod
    def _first_matching_symptom(
        catalog: tuple[str, ...],
        reported: set[str],
    ) -> str | None:
        matches = [
            (index, symptom)
            for index, symptom in enumerate(catalog)
            if normalize_symptom(symptom) in reported
        ]
        if not matches:
            return None
        index, symptom = max(
            matches,
            key=lambda item: (len(normalize_symptom(item[1])), -item[0]),
        )
        return symptom
