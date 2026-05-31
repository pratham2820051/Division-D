"""In-memory records loaded from diagnosis datasets."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class AnimalRecord:
    animal_id: str
    animal_name: str
    aliases: tuple[str, ...]
    supported: bool


@dataclass(frozen=True)
class SymptomRecord:
    symptom_id: str
    canonical_name: str
    aliases: tuple[str, ...]
    triage_tier: str | None = None
    symptom_family: str | None = None


@dataclass(frozen=True)
class DiseaseRecord:
    disease_id: str
    disease_name: str
    animal_types: tuple[str, ...]
    severity: str
    description: str
    vet_required: bool
    aliases: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class FollowUpQuestionRecord:
    disease_id: str
    question: str
    symptom_checked: str | None
