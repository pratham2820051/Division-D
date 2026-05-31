"""Normalize farmer messages before symptom and disease extraction."""

from __future__ import annotations

import re

from rapidfuzz import fuzz

from features.chat.utils.farmer_language_dictionary import (
    ASR_ANIMAL_CORRECTIONS,
    DISEASE_TYPO_CORRECTIONS,
    FARMER_PHRASE_TO_SYMPTOM,
    NATIVE_SCRIPT_ANIMAL_TO_ENGLISH,
    NATIVE_SCRIPT_SYMPTOM_TO_ENGLISH,
    ROMANIZED_ANIMAL_TO_ENGLISH,
    ROMANIZED_SYMPTOM_TO_ENGLISH,
    TRANSLITERATED_DISEASE_ALIASES,
)

FUZZY_PHRASE_THRESHOLD = 88


def _fuzzy_phrase_in_text(text: str, phrase: str) -> bool:
    if phrase in text:
        return True
    if " " not in phrase:
        for word in text.split():
            if fuzz.ratio(word, phrase) >= FUZZY_PHRASE_THRESHOLD:
                return True
        return False
    return fuzz.partial_ratio(phrase, text) >= FUZZY_PHRASE_THRESHOLD


def _replace_word(text: str, wrong: str, right: str) -> str:
    return re.sub(rf"\b{re.escape(wrong)}\b", right, text, flags=re.IGNORECASE)


def _replace_phrases(text: str, mapping: dict[str, str]) -> str:
    """Replace multi-word and single-word phrases longest-first."""
    result = text
    for phrase in sorted(mapping, key=len, reverse=True):
        replacement = mapping[phrase]
        if " " in phrase:
            if phrase in result:
                result = result.replace(phrase, replacement)
        else:
            result = _replace_word(result, phrase, replacement)
    return result


def _apply_word_corrections(text: str, corrections: dict[str, str]) -> str:
    result = text
    for wrong in sorted(corrections, key=len, reverse=True):
        right = corrections[wrong]
        if " " in wrong:
            if wrong in result:
                result = result.replace(wrong, right)
        else:
            result = _replace_word(result, wrong, right)
    return result


def normalize_whitespace(text: str) -> str:
    return " ".join(text.lower().split())


def _replace_native_script_phrases(text: str, mapping: dict[str, str]) -> str:
    """Replace Kannada/Hindi script tokens (no word boundaries)."""
    result = text
    for phrase in sorted(mapping, key=len, reverse=True):
        if phrase in result:
            result = result.replace(phrase, mapping[phrase])
    return result


def preprocess_farmer_message(message: str) -> str:
    """
    Normalize text for extraction:
    lowercase, native script + romanized Indic terms, ASR fixes, and disease typo correction.
    """
    text = normalize_whitespace(message)
    text = _replace_native_script_phrases(text, NATIVE_SCRIPT_ANIMAL_TO_ENGLISH)
    text = _replace_native_script_phrases(text, NATIVE_SCRIPT_SYMPTOM_TO_ENGLISH)
    text = _apply_word_corrections(text, ROMANIZED_ANIMAL_TO_ENGLISH)
    text = _apply_word_corrections(text, ROMANIZED_SYMPTOM_TO_ENGLISH)
    text = _apply_word_corrections(text, ASR_ANIMAL_CORRECTIONS)
    text = _apply_word_corrections(text, DISEASE_TYPO_CORRECTIONS)
    text = _apply_word_corrections(text, TRANSLITERATED_DISEASE_ALIASES)
    return text


def extract_farmer_phrase_symptoms(message: str) -> list[str]:
    """Map colloquial farmer phrases to canonical symptoms (order preserved)."""
    text = normalize_whitespace(message)
    hits: list[tuple[int, str]] = []
    used_spans: list[tuple[int, int]] = []

    for phrase, symptom in sorted(FARMER_PHRASE_TO_SYMPTOM.items(), key=lambda x: -len(x[0])):
        if not _fuzzy_phrase_in_text(text, phrase):
            continue
        start = text.find(phrase)
        if start < 0:
            start = 0
        end = start + len(phrase)
        if any(not (end <= s or start >= e) for s, e in used_spans):
            continue
        used_spans.append((start, end))
        hits.append((start, symptom))

    hits.sort(key=lambda item: item[0])
    seen: set[str] = set()
    ordered: list[str] = []
    for _, symptom in hits:
        key = symptom.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(symptom)
    return ordered


_OFF_TOPIC_PATTERNS: tuple[str, ...] = (
    r"\bipl\b",
    r"cricket",
    r"prime minister",
    r"who won",
    r"weather forecast",
    r"stock market",
    r"movie review",
    r"football score",
)

_LIVESTOCK_HINTS: tuple[str, ...] = (
    "cow",
    "cattle",
    "buffalo",
    "goat",
    "sheep",
    "chicken",
    "animal",
    "livestock",
    "pashu",
    "symptom",
    "fever",
    "udder",
    "milk",
    "drool",
    "lame",
    "abort",
    "anthrax",
    "mastitis",
    "fmd",
    # Kannada / Hindi script (before preprocess in domain classifier)
    "ಹಸು",
    "ಮೇಕೆ",
    "ಎಮ್ಮೆ",
    "ಕುರಿ",
    "ಜ್ವರ",
    "गाय",
    "बकरी",
    "भैंस",
    "ज्वर",
    "बुखार",
)


def is_off_topic_query(message: str, *, has_active_context: bool = False) -> bool:
    """Deprecated wrapper — use classify_message_domain instead."""
    _ = has_active_context
    from features.chat.utils.domain_classifier import (
        MessageDomain,
        classify_message_domain,
    )

    return classify_message_domain(message) is MessageDomain.OUT_OF_SCOPE
