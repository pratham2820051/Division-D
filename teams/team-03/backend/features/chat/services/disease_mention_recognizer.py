"""Detect explicit disease mentions in farmer messages."""

from __future__ import annotations

from dataclasses import dataclass

from rapidfuzz import fuzz

from features.chat.utils.text_preprocessor import preprocess_farmer_message
from features.rag.repositories.disease_repository import DiseaseRepository, get_default_repository

FUZZY_ALIAS_THRESHOLD = 88
DIRECT_MENTION_CONFIDENCE = 0.95
FUZZY_MENTION_CONFIDENCE = 0.82

DISEASE_MENTION_BOOST = 0.30


@dataclass(frozen=True)
class DiseaseMention:
    detected_disease: str
    disease_id: str
    confidence: float
    matched_alias: str


@dataclass(frozen=True)
class _DiseaseEntry:
    disease_id: str
    disease_name: str
    aliases: tuple[str, ...]


def build_disease_entries(repository: DiseaseRepository | None = None) -> tuple[_DiseaseEntry, ...]:
    """Build mention index entries from dataset disease aliases."""
    repo = repository or get_default_repository()
    repo.ensure_loaded()
    entries: list[_DiseaseEntry] = []
    for record in repo.get_disease_records():
        aliases = list(record.aliases)
        aliases.append(record.disease_name.lower())
        aliases.append(record.disease_id.replace("-", " "))
        unique_aliases = tuple(dict.fromkeys(alias.lower() for alias in aliases if alias.strip()))
        entries.append(
            _DiseaseEntry(
                disease_id=record.disease_id,
                disease_name=record.disease_name,
                aliases=unique_aliases,
            )
        )
    return tuple(entries)


class DiseaseMentionRecognizer:
    """Find explicit disease names, typos, and ASR errors in farmer text."""

    def __init__(
        self,
        entries: tuple[_DiseaseEntry, ...] | None = None,
        repository: DiseaseRepository | None = None,
    ) -> None:
        self._repository = repository or get_default_repository()
        self._entries = entries if entries is not None else build_disease_entries(self._repository)
        self._alias_index: list[tuple[str, _DiseaseEntry]] = []
        for entry in self._entries:
            for alias in entry.aliases:
                self._alias_index.append((alias.lower(), entry))
        self._alias_index.sort(key=lambda item: len(item[0]), reverse=True)

    def recognize(self, message: str) -> DiseaseMention | None:
        text = preprocess_farmer_message(message)
        if not text.strip():
            return None

        best: DiseaseMention | None = None

        for alias, entry in self._alias_index:
            if alias in text:
                mention = DiseaseMention(
                    detected_disease=entry.disease_name,
                    disease_id=entry.disease_id,
                    confidence=DIRECT_MENTION_CONFIDENCE,
                    matched_alias=alias,
                )
                if best is None or len(alias) > len(best.matched_alias):
                    best = mention

        if best is not None:
            return best

        words = text.split()
        for alias, entry in self._alias_index:
            alias_words = alias.split()
            if len(alias_words) == 1:
                for word in words:
                    score = fuzz.ratio(word, alias)
                    if score >= FUZZY_ALIAS_THRESHOLD:
                        return DiseaseMention(
                            detected_disease=entry.disease_name,
                            disease_id=entry.disease_id,
                            confidence=FUZZY_MENTION_CONFIDENCE,
                            matched_alias=word,
                        )
            else:
                score = fuzz.partial_ratio(alias, text)
                if score >= FUZZY_ALIAS_THRESHOLD:
                    return DiseaseMention(
                        detected_disease=entry.disease_name,
                        disease_id=entry.disease_id,
                        confidence=FUZZY_MENTION_CONFIDENCE,
                        matched_alias=alias,
                    )

        return None


def apply_disease_mention_boost(
    matches: list,
    mention: DiseaseMention,
    repository: DiseaseRepository | None = None,
) -> list:
    """Boost confidence when farmer explicitly names a disease."""
    from features.rag.schemas.disease import DiseaseMatch

    repo = repository or get_default_repository()
    repo.ensure_loaded()
    boost = repo.mention_boost_for_disease(mention.disease_id)
    boosted: list[DiseaseMatch] = []
    found = False

    for match in matches:
        if match.disease_id == mention.disease_id:
            found = True
            boosted.append(
                match.model_copy(
                    update={"confidence_score": min(1.0, match.confidence_score + boost)},
                )
            )
        else:
            boosted.append(match)

    if not found:
        boosted.append(
            DiseaseMatch(
                disease_id=mention.disease_id,
                disease_name=mention.detected_disease,
                confidence_score=boost,
                matched_symptoms=[],
                missing_symptoms=[],
            )
        )

    return sorted(
        boosted,
        key=lambda m: (m.confidence_score, m.disease_name),
        reverse=True,
    )
