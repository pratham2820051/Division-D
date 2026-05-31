"""Translation service facade — selects provider via config."""

from __future__ import annotations

import logging

from config.settings import settings
from features.translation.schemas.request import TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.base import TranslationProvider
from features.translation.services.groq_provider import GroqTranslationProvider
from features.translation.services.libretranslate_provider import LibreTranslateProvider
from features.translation.services.mock_provider import MockTranslationProvider
from features.translation.services.static_translation_provider import (
    ChainedTranslationProvider,
    StaticPhraseTranslationProvider,
)

logger = logging.getLogger(__name__)

_service: "TranslationService | None" = None


def _mock_provider() -> MockTranslationProvider:
    return MockTranslationProvider()


def _static_provider() -> StaticPhraseTranslationProvider:
    return StaticPhraseTranslationProvider()


def _build_libretranslate_provider(fallback: TranslationProvider) -> LibreTranslateProvider:
    return LibreTranslateProvider(
        base_url=settings.libretranslate_url,
        api_key=settings.libretranslate_api_key,
        fallback=fallback,
    )


def _build_groq_provider(fallback: TranslationProvider) -> GroqTranslationProvider:
    return GroqTranslationProvider(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        max_tokens=settings.groq_max_tokens,
        temperature=settings.groq_temperature,
        fallback=fallback,
    )


def _build_provider() -> TranslationProvider:
    provider = settings.translation_provider.lower().strip()
    mock = _mock_provider()
    static = _static_provider()
    groq_fallback = ChainedTranslationProvider([static, mock])

    if provider == "mock":
        logger.info("Translation provider: MockTranslationProvider (explicit mock mode)")
        return mock

    if provider == "groq":
        groq = _build_groq_provider(groq_fallback)
        logger.info(
            "Translation provider: Groq -> StaticPhrase -> Mock (api_key=%s)",
            bool(settings.groq_api_key.strip()),
        )
        return groq

    if provider == "libretranslate":
        chain = _build_libretranslate_provider(groq_fallback)
        logger.info("Translation provider: LibreTranslate -> fallback chain")
        return chain

    if provider == "auto":
        if settings.groq_api_key.strip():
            groq = _build_groq_provider(groq_fallback)
            logger.info(
                "Translation provider: auto -> Groq (model=%s)",
                settings.groq_model,
            )
            return groq
        if settings.libretranslate_url.strip():
            chain = _build_libretranslate_provider(groq_fallback)
            logger.info("Translation provider: auto -> LibreTranslate")
            return chain
        logger.warning("Translation provider: auto -> StaticPhrase (no GROQ_API_KEY)")
        return static

    logger.warning("Translation provider: unknown '%s' -> StaticPhrase", provider)
    return static


class TranslationService:
    def __init__(self, provider: TranslationProvider | None = None) -> None:
        self._provider = provider or _build_provider()
        self._provider_name = getattr(
            self._provider,
            "chain_name",
            type(self._provider).__name__,
        )
        logger.info("TranslationService initialized provider=%s", self._provider_name)

    @property
    def active_provider_name(self) -> str:
        return self._provider_name

    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        return await self._provider.translate(request)

    async def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: str | None = None,
    ) -> TranslateResponse:
        from features.translation.schemas.request import TargetLanguage

        return await self.translate(
            TranslateRequest(
                text=text,
                target_language=TargetLanguage(target_language),
                source_language=TargetLanguage(source_language) if source_language else None,
            )
        )


def get_translation_service() -> TranslationService:
    global _service
    if _service is None:
        _service = TranslationService()
    return _service


translation_service = get_translation_service()
