"""Groq LLM translation provider with mock fallback."""

import logging

from features.translation.schemas.request import TargetLanguage, TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.base import TranslationProvider
from features.translation.services.mock_provider import MockTranslationProvider

logger = logging.getLogger(__name__)

_SUPPORTED = {
    TargetLanguage.EN,
    TargetLanguage.KN,
    TargetLanguage.HI,
    TargetLanguage.TE,
    TargetLanguage.TA,
    TargetLanguage.UR,
}

_LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "kn": "Kannada",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "ur": "Urdu",
}

_SYSTEM_PROMPT = """You are a professional translator for PashuMitra AI, a livestock veterinary triage assistant used by rural farmers in India.

Rules:
- Translate accurately between the requested source and target languages.
- Preserve veterinary and livestock terminology: disease names (e.g. Mastitis, FMD, PPR), symptoms, animal species (cattle, buffalo, goat, sheep, poultry), anatomical terms, and first-aid instructions.
- Keep internationally recognized disease acronyms and Latin/scientific names recognizable; use standard local transliteration when a well-known regional term exists.
- Preserve numbers, units, punctuation, bullet points, and line breaks.
- Do not add explanations, notes, prefixes, or markdown.
- Output ONLY the translated text."""


class GroqTranslationProvider(TranslationProvider):
    """Translate via Groq chat completions API."""

    def __init__(
        self,
        api_key: str = "",
        model: str = "llama-3.3-70b-versatile",
        *,
        max_tokens: int = 1024,
        temperature: float = 0.3,
        fallback: TranslationProvider | None = None,
    ) -> None:
        self._api_key = api_key.strip()
        self._model = model
        self._max_tokens = max_tokens
        self._temperature = temperature
        self._fallback = fallback or MockTranslationProvider()

    def _language_name(self, code: str) -> str:
        return _LANGUAGE_NAMES.get(code, code)

    def _is_supported_pair(self, source: str, target: str) -> bool:
        try:
            source_lang = TargetLanguage(source)
            target_lang = TargetLanguage(target)
        except ValueError:
            return False
        if source_lang not in _SUPPORTED or target_lang not in _SUPPORTED:
            return False
        return True

    async def _call_groq(self, source: str, target: str, text: str) -> str:
        from groq import AsyncGroq

        client = AsyncGroq(api_key=self._api_key)
        source_name = self._language_name(source)
        target_name = self._language_name(target)
        user_prompt = (
            f"Translate the following text from {source_name} to {target_name}.\n\n{text}"
        )

        completion = await client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=self._temperature,
            max_tokens=self._max_tokens,
        )

        content = completion.choices[0].message.content
        if not content or not content.strip():
            raise ValueError("Empty Groq translation response")

        return content.strip()

    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        source = (request.source_language or TargetLanguage.EN).value
        target = request.target_language.value

        if source == target:
            return TranslateResponse(
                translated_text=request.text,
                source_language=source,
                target_language=target,
            )

        if not self._api_key:
            logger.warning("Groq API key missing, using fallback provider")
            return await self._fallback.translate(request)

        if not self._is_supported_pair(source, target):
            logger.warning(
                "Unsupported Groq language pair %s -> %s, using fallback",
                source,
                target,
            )
            return await self._fallback.translate(request)

        try:
            translated = await self._call_groq(source, target, request.text)
            return TranslateResponse(
                translated_text=translated,
                source_language=source,
                target_language=target,
            )
        except Exception as exc:
            logger.warning(
                "Groq translation failed (%s), using fallback provider %s",
                exc,
                type(self._fallback).__name__,
            )
            return await self._fallback.translate(request)
