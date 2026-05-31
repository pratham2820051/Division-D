"""First-aid recommendations from disease knowledge records."""

from __future__ import annotations

from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.schemas.first_aid import FirstAidRecommendation


class FirstAidService:
    """Resolve first-aid guidance for a predicted disease match."""

    def get_first_aid(
        self,
        disease_match: DiseaseMatch,
        diseases: list[Disease],
    ) -> FirstAidRecommendation:
        """
        Return first-aid steps for ``disease_match`` using the loaded disease catalog.

        Looks up the disease by ``disease_id``. If no record is found, ``first_aid``
        is an empty list while ``disease_name`` and ``confidence_score`` are taken
        from the match.
        """
        disease = self._find_disease(disease_match.disease_id, diseases)
        first_aid = list(disease.first_aid) if disease is not None else []

        return FirstAidRecommendation(
            disease_name=disease_match.disease_name,
            confidence_score=disease_match.confidence_score,
            first_aid=first_aid,
        )

    @staticmethod
    def _find_disease(disease_id: str, diseases: list[Disease]) -> Disease | None:
        for disease in diseases:
            if disease.disease_id == disease_id:
                return disease
        return None
