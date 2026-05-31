"""Extract structured symptoms from farmer free-form messages."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from rapidfuzz import fuzz

from features.chat.schemas.symptom_extraction import SymptomExtractionResult
from features.chat.services.disease_mention_recognizer import (
    DiseaseMention,
    DiseaseMentionRecognizer,
)
from features.chat.utils.text_preprocessor import (
    extract_farmer_phrase_symptoms,
    preprocess_farmer_message,
)
from features.confidence_scoring.utils.symptom_normalizer import normalize_symptom
from features.rag.schemas.enums import AnimalType

DEFAULT_ANIMAL_TYPE = AnimalType.CATTLE
FUZZY_KEYWORD_THRESHOLD = 86

# When a more specific symptom is detected, suppress broader aliases.
_SUPPRESSED_WHEN_PRESENT: dict[str, frozenset[str]] = {
    "fever": frozenset({"high fever"}),
}


@dataclass(frozen=True)
class SymptomRule:
    """Maps farmer phrases to a canonical symptom label."""

    canonical: str
    keywords: tuple[str, ...]


@dataclass(frozen=True)
class AnimalRule:
    """Maps farmer phrases to a supported animal type."""

    animal_type: AnimalType
    keywords: tuple[str, ...]


# Longer keyword phrases are matched first (see RuleBasedSymptomExtractor).
SYMPTOM_RULES: tuple[SymptomRule, ...] = (
    SymptomRule("high fever", ("high fever", "very high fever", "running a fever")),
    SymptomRule("fever", ("fever", "temperature", "hot to touch", "jwara", "jvara", "bukhar", "bukhhar", "taap", "tapa")),
    SymptomRule(
        "drooling",
        (
            "drooling",
            "drool",
            "saliva",
            "excessive salivation",
            "excessive salivation and drooling",
            "salivating",
        ),
    ),
    SymptomRule(
        "reduced appetite",
        (
            "not eating",
            "won't eat",
            "wont eat",
            "refusing feed",
            "off feed",
            "loss of appetite",
            "reduced appetite",
            "not eating well",
            "poor appetite",
        ),
    ),
    SymptomRule(
        "blisters on tongue and gums",
        (
            "blisters on tongue and gums",
            "blisters in its mouth",
            "blisters in the mouth",
            "blisters in mouth",
            "blisters on tongue",
            "mouth ulcers",
            "ulcers in mouth",
            "sores in mouth",
        ),
    ),
    SymptomRule(
        "blisters on hooves and between digits",
        (
            "blisters on hooves",
            "blisters on feet",
            "hoof blisters",
            "blisters between digits",
        ),
    ),
    SymptomRule(
        "firm skin nodules on neck and body",
        ("skin nodules", "lumps on skin", "firm nodules", "nodules on neck", "lumpy skin"),
    ),
    SymptomRule(
        "swollen painful udder quarter",
        ("swollen udder", "painful udder", "swollen painful udder", "udder swelling"),
    ),
    SymptomRule("difficulty breathing", ("difficulty breathing", "labored breathing", "breathing hard")),
    SymptomRule("unable to stand", ("unable to stand", "cannot stand", "can't stand", "not able to stand", "not standing")),
    SymptomRule(
        "swelling of neck brisket or flanks",
        ("swollen neck", "neck swelling", "swelling on neck", "swollen brisket"),
    ),
    SymptomRule(
        "sudden death without warning",
        ("sudden death", "died suddenly", "found dead"),
    ),
    SymptomRule(
        "bloody discharge from natural openings",
        ("bloody discharge", "blood from nose", "bloody stool", "bloody urine"),
    ),
    SymptomRule("lameness and reluctance to walk", ("lameness", "lame", "reluctance to walk", "not walking")),
    SymptomRule("nasal discharge", ("nasal discharge", "runny nose", "nose discharge")),
    SymptomRule("reduced milk yield", ("low milk", "reduced milk", "drop in milk", "less milk")),
    SymptomRule(
        "weakness and lethargy",
        ("weak", "very weak", "animal weak", "looks weak", "lethargic", "dull", "weakness"),
    ),
)

ANIMAL_RULES: tuple[AnimalRule, ...] = (
    AnimalRule(
        AnimalType.CATTLE,
        (
            "cattle", "cow", "cows", "bull", "calf", "heifer", "ox",
            "hasu", "hasuvu", "hasuvige", "hasuvina", "hasugige",
            "gai", "gaay", "meri gai",
        ),
    ),
    AnimalRule(
        AnimalType.BUFFALO,
        (
            "buffalo", "buffaloes", "buffalos",
            "emme", "emmegige", "emmena",
            "bhains", "bhainsa", "bhains ko",
        ),
    ),
    AnimalRule(
        AnimalType.GOAT,
        (
            "goat", "goats", "kid",
            "meke", "mekege", "mekey", "mekke", "nanna meke", "nanna mekege",
            "bakri", "bakri ko", "meri bakri",
        ),
    ),
    AnimalRule(
        AnimalType.SHEEP,
        (
            "sheep", "lamb", "lambs", "ram", "ewe", "ewes",
            "kuri", "kurige", "kurina", "kurigige",
            "bhed", "bhed ko", "bhedh",
        ),
    ),
    AnimalRule(AnimalType.PIG, ("pig", "pigs", "swine", "hog")),
    AnimalRule(AnimalType.POULTRY, ("chicken", "hen", "rooster", "poultry", "bird", "duck")),
)


class SymptomExtractor(Protocol):
    """
    Symptom extraction backend contract.

    Future: ``GroqSymptomExtractor`` can implement this protocol for LLM-based parsing.
    """

    def extract(self, message: str) -> SymptomExtractionResult:
        """Parse a farmer message into structured animal type and symptoms."""


class RuleBasedSymptomExtractor:
    """Deterministic keyword and phrase matching against symptom dictionaries."""

    def __init__(
        self,
        symptom_rules: tuple[SymptomRule, ...] = SYMPTOM_RULES,
        animal_rules: tuple[AnimalRule, ...] = ANIMAL_RULES,
        default_animal_type: AnimalType = DEFAULT_ANIMAL_TYPE,
    ) -> None:
        self._symptom_rules = sorted(
            symptom_rules,
            key=lambda rule: max(len(keyword) for keyword in rule.keywords),
            reverse=True,
        )
        self._animal_rules = sorted(
            animal_rules,
            key=lambda rule: max(len(keyword) for keyword in rule.keywords),
            reverse=True,
        )
        self._default_animal_type = default_animal_type

    def extract(self, message: str) -> SymptomExtractionResult:
        text = self._normalize_message(message)
        return SymptomExtractionResult(
            animal_type=self._extract_animal_type(text),
            symptoms=self._extract_symptoms(text),
        )

    def _extract_animal_type(self, text: str) -> AnimalType:
        for rule in self._animal_rules:
            if any(keyword in text for keyword in rule.keywords):
                return rule.animal_type
        return self._default_animal_type

    def _extract_symptoms(self, text: str) -> list[str]:
        hits: list[tuple[int, str, str]] = []

        for rule in self._symptom_rules:
            earliest_index: int | None = None
            for keyword in rule.keywords:
                index = self._find_keyword(text, keyword)
                if index >= 0 and (earliest_index is None or index < earliest_index):
                    earliest_index = index
            if earliest_index is None:
                continue
            normalized = normalize_symptom(rule.canonical)
            hits.append((earliest_index, rule.canonical, normalized))

        hits.sort(key=lambda item: (item[0], item[2]))

        matched: list[str] = []
        seen: set[str] = set()
        for _, canonical, normalized in hits:
            if normalized in seen:
                continue
            seen.add(normalized)
            matched.append(canonical)

        return self._apply_suppression_rules(matched)

    @staticmethod
    def _find_keyword(text: str, keyword: str) -> int:
        index = text.find(keyword)
        if index >= 0:
            return index

        if " " in keyword:
            if fuzz.partial_ratio(keyword, text) >= FUZZY_KEYWORD_THRESHOLD:
                return 0
            return -1

        for word in text.split():
            if fuzz.ratio(word, keyword) >= FUZZY_KEYWORD_THRESHOLD:
                return text.find(word)
        return -1

    @staticmethod
    def _apply_suppression_rules(symptoms: list[str]) -> list[str]:
        return apply_suppression_rules(symptoms)

    @staticmethod
    def _normalize_message(message: str) -> str:
        return " ".join(message.lower().split())


def apply_suppression_rules(symptoms: list[str]) -> list[str]:
    """Drop broader symptoms when a more specific canonical label is present."""
    normalized_present = {normalize_symptom(symptom) for symptom in symptoms}
    filtered: list[str] = []
    for symptom in symptoms:
        normalized = normalize_symptom(symptom)
        suppressors = _SUPPRESSED_WHEN_PRESENT.get(normalized, frozenset())
        if suppressors & normalized_present:
            continue
        filtered.append(symptom)
    return filtered


def detect_animal_type_in_text(text: str) -> AnimalType | None:
    """Return animal type when message text mentions a species (after preprocessing)."""
    normalized = " ".join(text.lower().split())
    if not normalized:
        return None

    for rule in ANIMAL_RULES:
        for keyword in sorted(rule.keywords, key=len, reverse=True):
            if keyword in normalized:
                return rule.animal_type
    return None


def detect_animal_only_message(message: str) -> AnimalType | None:
    """Return animal type when the message is a short animal-only reply (e.g. 'Cow')."""
    text = preprocess_farmer_message(message).strip()
    if not text or len(text.split()) > 3:
        return None

    for rule in ANIMAL_RULES:
        for keyword in rule.keywords:
            if text == keyword or text == f"my {keyword}" or text == f"a {keyword}":
                return rule.animal_type
    return None


def create_default_extractor() -> SymptomExtractor:
    """Select Groq or rule-based extractor based on ``USE_GROQ_EXTRACTION``."""
    from config.settings import settings

    if settings.use_groq_extraction:
        from features.chat.services.groq_symptom_extractor import GroqSymptomExtractor

        return GroqSymptomExtractor()
    return RuleBasedSymptomExtractor()


class SymptomExtractionService:
    """Facade for symptom extraction with a swappable backend implementation."""

    def __init__(
        self,
        extractor: SymptomExtractor | None = None,
        mention_recognizer: DiseaseMentionRecognizer | None = None,
    ) -> None:
        self._extractor = extractor or create_default_extractor()
        self._mention_recognizer = mention_recognizer or DiseaseMentionRecognizer()

    def extract(self, message: str) -> SymptomExtractionResult:
        """Extract animal type and canonical symptoms from a farmer message."""
        preprocessed = preprocess_farmer_message(message)
        result = self._extractor.extract(preprocessed)
        farmer_symptoms = extract_farmer_phrase_symptoms(message)
        if not farmer_symptoms:
            return result

        merged = self._merge_symptoms(farmer_symptoms, result.symptoms)
        return SymptomExtractionResult(
            animal_type=result.animal_type,
            symptoms=merged,
        )

    @staticmethod
    def _merge_symptoms(primary: list[str], secondary: list[str]) -> list[str]:
        seen: set[str] = set()
        merged: list[str] = []
        for symptom in primary + secondary:
            key = normalize_symptom(symptom)
            if key in seen:
                continue
            seen.add(key)
            merged.append(symptom)
        return apply_suppression_rules(merged)

    def recognize_disease_mention(self, message: str) -> DiseaseMention | None:
        """Detect explicit disease names, typos, and ASR errors."""
        return self._mention_recognizer.recognize(message)
