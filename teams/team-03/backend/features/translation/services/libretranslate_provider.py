"""LibreTranslate HTTP provider with mock fallback."""

import logging

import httpx

from features.translation.schemas.request import TargetLanguage, TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.base import TranslationProvider
from features.translation.services.mock_provider import MockTranslationProvider

logger = logging.getLogger(__name__)

# LibreTranslate / Argos language codes aligned with our TargetLanguage enum
_SUPPORTED = {"en", "kn", "hi", "te", "ta", "ml", "ur"}


class LibreTranslateProvider(TranslationProvider):
    def __init__(
        self,
        base_url: str = "https://libretranslate.com",
        api_key: str = "",
        *,
        fallback: TranslationProvider | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._fallback = fallback or MockTranslationProvider()

    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        source = (request.source_language or TargetLanguage.EN).value
        target = request.target_language.value

        if target == TargetLanguage.EN.value and source == TargetLanguage.EN.value:
            return TranslateResponse(
                translated_text=request.text,
                source_language=source,
                target_language=target,
            )

        if target not in _SUPPORTED or source not in _SUPPORTED:
            logger.warning("Unsupported language pair %s -> %s, using fallback", source, target)
            return await self._fallback.translate(request)

        payload: dict[str, str] = {
            "q": request.text,
            "source": source,
            "target": target,
            "format": "text",
        }
        if self._api_key:
            payload["api_key"] = self._api_key

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(f"{self._base_url}/translate", json=payload)
                response.raise_for_status()
                data = response.json()
                translated = data.get("translatedText") or data.get("translated_text")
                if not translated:
                    raise ValueError("Empty translation response")
                return TranslateResponse(
                    translated_text=translated,
                    source_language=source,
                    target_language=target,
                )
        except Exception as exc:
            logger.warning("LibreTranslate failed (%s), using fallback provider", exc)
            return await self._fallback.translate(request)
