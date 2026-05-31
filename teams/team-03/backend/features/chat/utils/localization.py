"""Translate assistant blocks for non-English chat language (sync wrapper)."""

import asyncio
import logging
import re

from features.chat.schemas.messages import AssistantBlock, MessageType
from features.chat.utils.farmer_messages import (
    _GATHERING_INTRO_DYNAMIC,
    farmer_message,
    localize_system_message,
)
from features.translation.services.translation_service import get_translation_service

logger = logging.getLogger(__name__)

_MOCK_PREFIX_PATTERN = re.compile(r"^\[[^\]]+\]\s*")


def _run_translate(text: str, target_language: str) -> str:
    if target_language == "en" or not text.strip():
        return text

    service = get_translation_service()
    try:
        result = asyncio.run(
            service.translate_text(text, target_language=target_language),
        )
    except Exception as exc:
        logger.warning(
            "Translation failed target=%s provider=%s text=%r err=%s",
            target_language,
            service.active_provider_name,
            text[:80],
            exc,
        )
        return text

    translated = result.translated_text

    if _MOCK_PREFIX_PATTERN.match(translated) and service.active_provider_name != "MockTranslationProvider":
        logger.warning(
            "Stripping unexpected mock prefix from translation target=%s provider=%s",
            target_language,
            service.active_provider_name,
        )
        translated = _MOCK_PREFIX_PATTERN.sub("", translated, count=1)

    logger.debug(
        "Localized text target=%s provider=%s in_len=%d out_len=%d",
        target_language,
        service.active_provider_name,
        len(text),
        len(translated),
    )
    return translated


def _translate_list(items: list, language: str) -> list:
    return [_run_translate(str(item), language) for item in items]


def _localize_content(content: str, language: str) -> str:
    if language == "en":
        return content

    dynamic = _GATHERING_INTRO_DYNAMIC.match(content.strip())
    if dynamic:
        symptoms = _run_translate(dynamic.group(1).strip(), language)
        disease = _run_translate(dynamic.group(2).strip(), language)
        return farmer_message(
            "gathering_intro_dynamic",
            language,
            symptoms=symptoms,
            disease=disease,
        )

    system_copy = localize_system_message(content, language)
    if system_copy != content:
        return system_copy
    return _run_translate(content, language)


def localize_blocks(blocks: list[AssistantBlock], language: str) -> list[AssistantBlock]:
    """Translate user-visible text fields when chat language is not English."""
    if language == "en":
        return blocks

    logger.info(
        "localize_blocks language=%s provider=%s blocks=%d",
        language,
        get_translation_service().active_provider_name,
        len(blocks),
    )

    localized: list[AssistantBlock] = []
    for block in blocks:
        content = _localize_content(block.content, language)
        payload = dict(block.payload) if block.payload else None

        if payload and block.message_type == MessageType.DIAGNOSTIC_QUESTION:
            if payload.get("context") and not payload.get("symptom_key"):
                payload["symptom_key"] = payload["context"]
            if question := payload.get("question"):
                if not payload.get("question_key"):
                    payload["question_key"] = str(question)
                payload["question"] = _run_translate(str(question), language)
            if block.message_type == MessageType.DIAGNOSTIC_QUESTION and payload.get("question"):
                content = str(payload["question"])

        if payload and block.message_type == MessageType.DISEASE_ANALYSIS:
            diseases = payload.get("diseases")
            if isinstance(diseases, list):
                for entry in diseases:
                    if not isinstance(entry, dict):
                        continue
                    if entry.get("name"):
                        entry["name"] = _run_translate(str(entry["name"]), language)
                    for field in ("matched_symptoms", "missing_symptoms"):
                        symptoms = entry.get(field)
                        if isinstance(symptoms, list):
                            entry[field] = _translate_list(symptoms, language)

        if payload and block.message_type == MessageType.FIRST_AID:
            instructions = payload.get("instructions")
            if isinstance(instructions, list):
                payload["instructions"] = _translate_list(instructions, language)

        if payload and block.message_type == MessageType.SMS_ALERT:
            if alert := payload.get("alert_text"):
                payload["alert_text"] = _run_translate(str(alert), language)
            if whatsapp := payload.get("whatsapp_text"):
                payload["whatsapp_text"] = _run_translate(str(whatsapp), language)

        localized.append(
            AssistantBlock(
                message_type=block.message_type,
                content=content,
                payload=payload,
            ),
        )

    return localized
