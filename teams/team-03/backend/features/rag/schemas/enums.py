"""Domain enumerations for livestock disease triage and RAG."""

from enum import Enum


class AnimalType(str, Enum):
    """Supported livestock categories for disease knowledge and triage."""

    CATTLE = "cattle"
    BUFFALO = "buffalo"
    GOAT = "goat"
    SHEEP = "sheep"
    PIG = "pig"
    POULTRY = "poultry"
    HORSE = "horse"
    DOG = "dog"


class DiseaseSeverityLevel(str, Enum):
    """Inherent severity of a disease in the knowledge base."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TriageSeverity(str, Enum):
    """Outcome severity assigned after symptom-based triage."""

    SELF_TREATABLE = "self_treatable"
    URGENT = "urgent"
    CRITICAL = "critical"


class MessageLanguage(str, Enum):
    """Languages supported for farmer-facing SMS drafts."""

    EN = "en"
    HI = "hi"
    MR = "mr"
    KN = "kn"
    TA = "ta"
    TE = "te"
