"""Resolve the active conversation language for farmer-facing responses."""

from __future__ import annotations


def normalize_language_code(language: str | None) -> str | None:
    if not language:
        return None
    normalized = language.strip().lower().split("-")[0]
    if not normalized or normalized == "auto":
        return None
    return normalized


def resolve_conversation_language(
    user_language: str | None,
    detected_language: str | None = None,
    *,
    message_text: str | None = None,
) -> str:
    """
    Priority: user-selected language → STT/text detected language → English.

    ``user_language`` comes from the UI dropdown / explicit chat request.
    ``detected_language`` comes from Sarvam STT when voice metadata is present.
    ``message_text`` enables romanized Kannada/Hindi detection for typed input.
    """
    from features.chat.utils.message_language import infer_language_from_message

    selected = normalize_language_code(user_language)
    inferred = infer_language_from_message(message_text)
    detected = normalize_language_code(detected_language) or inferred

    # Explicit non-English UI selection always wins.
    if selected and selected != "en":
        return selected

    if detected:
        return detected

    if selected:
        return selected

    return "en"
