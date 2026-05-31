"""Infer conversation language from farmer message text (script + romanized hints)."""

from __future__ import annotations

import re

from features.chat.utils.conversation_language import normalize_language_code

_KANNADA_SCRIPT = re.compile(r"[\u0C80-\u0CFF]")
_DEVANAGARI_SCRIPT = re.compile(r"[\u0900-\u097F]")

# Romanized / transliterated hints (word-boundary matched)
_KANNADA_HINTS: frozenset[str] = frozenset(
    {
        "nanna",
        "nanage",
        "hasu",
        "hasuvu",
        "hasuvige",
        "hasugige",
        "emme",
        "emmegige",
        "kuri",
        "kurige",
        "meke",
        "mekke",
        "jwara",
        "jvara",
        "bandide",
        "ide",
        "illa",
        "hogi",
        "aagide",
    },
)

_HINDI_HINTS: frozenset[str] = frozenset(
    {
        "meri",
        "mera",
        "mere",
        "gai",
        "gaay",
        "gay",
        "bhains",
        "bhainsa",
        "bakri",
        "bukhar",
        "bukhhar",
        "bimar",
        "hai",
        "nahi",
        "kha",
        "rahi",
        "ho",
        "raha",
    },
)


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z]+", text.lower()))


def infer_language_from_message(message: str | None) -> str | None:
    """
    Detect kn/hi/en from Unicode script or romanized farmer speech.

    Returns None when no strong signal (caller keeps user-selected language).
    """
    if not message or not message.strip():
        return None

    if _KANNADA_SCRIPT.search(message):
        return "kn"

    if _DEVANAGARI_SCRIPT.search(message):
        return "hi"

    tokens = _tokenize(message)
    if not tokens:
        return None

    kn_score = len(tokens & _KANNADA_HINTS)
    hi_score = len(tokens & _HINDI_HINTS)

    if kn_score > hi_score and kn_score >= 1:
        return "kn"
    if hi_score > kn_score and hi_score >= 1:
        return "hi"
    if kn_score == hi_score and kn_score >= 2:
        return "kn" if "nanna" in tokens or "hasu" in tokens else "hi"

    return None
