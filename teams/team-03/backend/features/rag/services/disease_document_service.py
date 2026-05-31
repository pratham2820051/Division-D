"""Load and validate disease knowledge-base documents."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from features.rag.repositories.disease_repository import (
    DiseaseRepository,
    get_default_repository,
)
from features.rag.schemas.disease import Disease

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DOCUMENTS_DIR = _BACKEND_ROOT / "datasets" / "examples"
DISEASE_DOCUMENT_SCHEMA_PATH = _BACKEND_ROOT / "datasets" / "disease_document.schema.json"


class DiseaseDocumentError(Exception):
    """Raised when a disease document cannot be read or validated."""


class DiseaseDocumentService:
    """Manage disease knowledge from CSV datasets or legacy JSON documents."""

    def __init__(
        self,
        documents_dir: Path | str | None = None,
        repository: DiseaseRepository | None = None,
        *,
        prefer_json: bool = False,
    ) -> None:
        self._documents_dir = Path(documents_dir) if documents_dir else DEFAULT_DOCUMENTS_DIR
        self._repository = repository
        self._prefer_json = prefer_json

    @property
    def documents_dir(self) -> Path:
        return self._documents_dir

    @property
    def repository(self) -> DiseaseRepository | None:
        if self._repository is not None:
            return self._repository
        if self._should_use_json():
            return None
        return get_default_repository()

    @staticmethod
    def schema_path() -> Path:
        return DISEASE_DOCUMENT_SCHEMA_PATH

    def load_document(self, path: Path | str) -> Disease:
        """Load and validate a single disease JSON file."""
        file_path = Path(path)
        if not file_path.is_file():
            raise DiseaseDocumentError(f"Disease document not found: {file_path}")

        try:
            payload = self._read_json(file_path)
        except json.JSONDecodeError as exc:
            raise DiseaseDocumentError(f"Invalid JSON in {file_path}: {exc}") from exc

        return self._validate_payload(payload, source=str(file_path))

    def load_documents_from_directory(
        self,
        directory: Path | str | None = None,
        *,
        pattern: str = "*.json",
    ) -> list[Disease]:
        """Load all disease JSON files in a directory, sorted by disease_id."""
        root = Path(directory) if directory else self._documents_dir
        if not root.is_dir():
            raise DiseaseDocumentError(f"Disease documents directory not found: {root}")

        documents: list[Disease] = []
        for file_path in sorted(root.glob(pattern)):
            if file_path.name.startswith("."):
                continue
            documents.append(self.load_document(file_path))

        return sorted(documents, key=lambda disease: disease.disease_id)

    def load_all(self, animal_type: str | None = None) -> list[Disease]:
        """Load every disease from datasets (default) or legacy JSON directory."""
        if self._repository is not None:
            self._repository.ensure_loaded()
            return self._repository.to_disease_models(animal_type)

        if self._should_use_json():
            diseases = self.load_documents_from_directory(self._documents_dir)
            if animal_type:
                normalized = animal_type.strip().lower()
                filtered = [
                    disease
                    for disease in diseases
                    if disease.animal_type.value == normalized
                ]
                if filtered:
                    return filtered
            return diseases

        repository = get_default_repository()
        repository.ensure_loaded()
        if repository.is_loaded() and repository.get_disease_records():
            return repository.to_disease_models(animal_type)

        return self.load_documents_from_directory(self._documents_dir)

    def get_by_id(self, disease_id: str) -> Disease | None:
        """Return a disease by ID, if present."""
        for disease in self.load_all():
            if disease.disease_id == disease_id:
                return disease
        return None

    def _should_use_json(self) -> bool:
        if self._prefer_json:
            return True
        return self._documents_dir.resolve() != DEFAULT_DOCUMENTS_DIR.resolve()

    @staticmethod
    def _read_json(path: Path) -> Any:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)

    @staticmethod
    def _validate_payload(payload: Any, *, source: str) -> Disease:
        if not isinstance(payload, dict):
            raise DiseaseDocumentError(
                f"Disease document at {source} must be a JSON object, got {type(payload).__name__}"
            )
        try:
            return Disease.model_validate(payload)
        except ValidationError as exc:
            raise DiseaseDocumentError(
                f"Disease document at {source} failed validation: {exc}"
            ) from exc
