"""Dataset-backed disease knowledge repositories."""

from features.rag.repositories.disease_repository import (
    DiseaseRepository,
    get_default_repository,
    reset_default_repository,
)

__all__ = [
    "DiseaseRepository",
    "get_default_repository",
    "reset_default_repository",
]
