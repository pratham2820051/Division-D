"""Symptom-based disease retrieval (embedding / vector backends swappable later)."""

from __future__ import annotations

from typing import Protocol

from features.confidence_scoring.services.confidence_service import ConfidenceScoringService
from features.rag.schemas.disease import Disease, DiseaseMatch
from features.rag.services.disease_document_service import DiseaseDocumentService


class DiseaseRetriever(Protocol):
    """
    Retrieval backend contract.

    Future implementations may use ChromaDB, LangChain retrievers, or other vector
  search while ``DiseaseRetrievalService`` keeps a stable caller-facing API.
    """

    def retrieve_candidates(
        self,
        user_symptoms: list[str],
        diseases: list[Disease],
        *,
        top_k: int,
    ) -> list[DiseaseMatch]:
        """Rank diseases for the given symptoms and return up to ``top_k`` matches."""


class SymptomOverlapDiseaseRetriever:
    """Deterministic retrieval via symptom overlap confidence scoring."""

    def __init__(self, scoring_service: ConfidenceScoringService) -> None:
        self._scoring_service = scoring_service

    def retrieve_candidates(
        self,
        user_symptoms: list[str],
        diseases: list[Disease],
        *,
        top_k: int,
        rejected_symptoms: list[str] | None = None,
    ) -> list[DiseaseMatch]:
        if top_k <= 0 or not diseases:
            return []

        matches = self._scoring_service.score_multiple_diseases(
            user_symptoms,
            diseases,
            rejected_symptoms=rejected_symptoms,
        )
        non_zero_matches = [match for match in matches if match.confidence_score > 0.0]
        return non_zero_matches[:top_k]


class DiseaseRetrievalService:
    """Load disease knowledge and return ranked candidate matches for reported symptoms."""

    def __init__(
        self,
        document_service: DiseaseDocumentService | None = None,
        scoring_service: ConfidenceScoringService | None = None,
        retriever: DiseaseRetriever | None = None,
    ) -> None:
        self._document_service = document_service or DiseaseDocumentService()
        repository = self._document_service.repository
        scoring = scoring_service or ConfidenceScoringService(repository=repository)
        self._retriever = retriever or SymptomOverlapDiseaseRetriever(scoring)

    def retrieve_candidates(
        self,
        user_symptoms: list[str],
        top_k: int = 5,
        disease_mention: object | None = None,
        animal_type: str | None = None,
        rejected_symptoms: list[str] | None = None,
    ) -> list[DiseaseMatch]:
        """
        Return up to ``top_k`` disease candidates with non-zero confidence.

        Diseases are loaded from the configured document store, scored, sorted by
        confidence (descending), and filtered to exclude zero-confidence matches.
        """
        from features.chat.services.disease_mention_recognizer import (
            apply_disease_mention_boost,
        )

        diseases = self._document_service.load_all(animal_type=animal_type)
        matches = self._retriever.retrieve_candidates(
            user_symptoms,
            diseases,
            top_k=top_k,
            rejected_symptoms=rejected_symptoms,
        )
        if disease_mention is not None:
            matches = apply_disease_mention_boost(matches, disease_mention)
            matches = [m for m in matches if m.confidence_score > 0.0][:top_k]
        return matches
