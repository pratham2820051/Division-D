"""Mock translation provider for hackathon / offline development."""

import asyncio
import logging

from config.settings import settings
from features.translation.schemas.request import TargetLanguage, TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.base import TranslationProvider

logger = logging.getLogger(__name__)

# Simple phrase replacements for demo (replace with Groq/IndicTrans later)
_MOCK_PREFIX: dict[TargetLanguage, str] = {
    TargetLanguage.EN: "",
    TargetLanguage.KN: "[ಕನ್ನಡ] ",
    TargetLanguage.HI: "[हिन्दी] ",
    TargetLanguage.TE: "[తెలుగు] ",
    TargetLanguage.TA: "[தமிழ்] ",
    TargetLanguage.ML: "[മലയാളം] ",
    TargetLanguage.UR: "[اردو] ",
}

_MOCK_REPLACEMENTS: dict[TargetLanguage, dict[str, str]] = {
    TargetLanguage.HI: {
        "Possible disease": "संभावित रोग",
        "Severity": "गंभीरता",
        "Urgent": "तत्काल",
        "First aid": "प्राथमिक उपचार",
    },
    TargetLanguage.KN: {
        "Possible disease": "ಸಂಭವನೀಯ ರೋಗ",
        "Severity": "ತೀವ್ರತೆ",
        "Urgent": "ತುರ್ತು",
    },
    TargetLanguage.TE: {
        "Possible disease": "సాధ్యమైన వ్యాధి",
        "Severity": "తీవ్రత",
        "Urgent": "అత్యవసరం",
    },
    TargetLanguage.TA: {
        "Possible disease": "சாத்தியமான நோய்",
        "Severity": "தீவிரம்",
        "Urgent": "அவசரம்",
    },
    TargetLanguage.ML: {
        "Possible disease": "സാധ്യമായ രോഗം",
        "Severity": "തീവ്രത",
        "Urgent": "അടിയന്തിരം",
    },
    TargetLanguage.UR: {
        "Possible disease": "ممکنہ بیماری",
        "Severity": "شدت",
        "Urgent": "فوری",
    },
}


class MockTranslationProvider(TranslationProvider):
    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        await asyncio.sleep(0.15)

        source = request.source_language or TargetLanguage.EN
        target = request.target_language
        text = request.text

        if target == TargetLanguage.EN:
            translated = text
        elif settings.translation_provider.lower().strip() == "mock":
            translated = text
            for eng, local in _MOCK_REPLACEMENTS.get(target, {}).items():
                translated = translated.replace(eng, local)
            prefix = _MOCK_PREFIX.get(target, f"[{target.value}] ")
            if prefix and not translated.startswith(prefix):
                translated = prefix + translated
        elif settings.translation_provider.lower().strip() == "mock":
            translated = text
            for eng, local in _MOCK_REPLACEMENTS.get(target, {}).items():
                translated = translated.replace(eng, local)
            prefix = _MOCK_PREFIX.get(target, f"[{target.value}] ")
            if prefix and not translated.startswith(prefix):
                translated = prefix + translated
        else:
            from features.translation.services.template_translation import try_template_translate

            source = (request.source_language or TargetLanguage.EN).value
            templated = try_template_translate(text, target.value, source)
            if templated:
                translated = templated
            else:
                logger.error(
                    "Mock translation used as last-resort fallback target=%s — "
                    "no template match; returning English",
                    target.value,
                )
                translated = text

        return TranslateResponse(
            translated_text=translated,
            source_language=source.value,
            target_language=target.value,
        )
