"""Supported livestock species for diagnosis and triage."""

from __future__ import annotations

from features.rag.schemas.enums import AnimalType

UNSUPPORTED_ANIMAL_MESSAGE = (
    "Currently PashuMitra AI supports cattle, buffalo, goat and sheep only."
)

SUPPORTED_ANIMAL_TYPES: frozenset[AnimalType] = frozenset(
    {
        AnimalType.CATTLE,
        AnimalType.BUFFALO,
        AnimalType.GOAT,
        AnimalType.SHEEP,
    }
)

SUPPORTED_ANIMAL_VALUES: frozenset[str] = frozenset(
    animal.value for animal in SUPPORTED_ANIMAL_TYPES
)


def is_supported_animal_type(animal: AnimalType | str | None) -> bool:
    """True when the species may enter diagnosis / triage."""
    if animal is None:
        return True
    value = animal.value if isinstance(animal, AnimalType) else str(animal).strip().lower()
    if not value:
        return True
    return value in SUPPORTED_ANIMAL_VALUES


def is_unsupported_animal_type(animal: AnimalType | str | None) -> bool:
    """True when an explicit species was detected but is out of scope."""
    if animal is None:
        return False
    value = animal.value if isinstance(animal, AnimalType) else str(animal).strip().lower()
    if not value:
        return False
    return value not in SUPPORTED_ANIMAL_VALUES
