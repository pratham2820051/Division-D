"""Deterministic phrase translations when Groq/API translation is unavailable."""

from __future__ import annotations

import logging

from features.translation.schemas.request import TargetLanguage, TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.base import TranslationProvider
from features.translation.services.template_translation import try_template_translate

logger = logging.getLogger(__name__)

# English source -> {lang: translation}
PHRASE_TRANSLATIONS: dict[str, dict[str, str]] = {
    "I have a few questions to identify the disease.": {
        "kn": "ರೋಗವನ್ನು ಗುರುತಿಸಲು ನಾನು ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ.",
        "hi": "रोग की पहचान के लिए मुझे कुछ प्रश्न पूछने हैं।",
    },
    "Which animal is affected (cow, goat, buffalo) and what symptoms do you see?": {
        "kn": "ಯಾವ ಪ್ರಾಣಿ ಬಾಧಿತವಾಗಿದೆ (ಹಸು, ಮೇಕೆ, ಎಮ್ಮೆ) ಮತ್ತು ನೀವು ಯಾವ ಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿದ್ದೀರಿ?",
        "hi": "कौन सा जानवर प्रभावित है (गाय, बकरी, भैंस) और आपने क्या लक्षण देखे?",
    },
    "Please share any other symptoms you notice.": {
        "kn": "ದಯವಿಟ್ಟು ನೀವು ಗಮನಿಸಿದ ಇತರ ಲಕ್ಷಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.",
        "hi": "कृपया आपने देखे अन्य लक्षण साझा करें।",
    },
    "Preliminary assessment for your {animal}.": {
        "kn": "ನಿಮ್ಮ {animal} ಗಾಗಿ ಪ್ರಾಥಮಿಕ ಮೌಲ್ಯಮಾಪನ.",
        "hi": "आपके {animal} के लिए प्रारंभिक आकलन।",
    },
    "Disease analysis": {
        "kn": "ರೋಗ ವಿಶ್ಲೇಷಣೆ",
        "hi": "रोग विश्लेषण",
    },
    "Foot and Mouth Disease": {
        "kn": "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ",
        "hi": "मुंह और खुर रोग",
    },
    "First-aid instructions": {
        "kn": "ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ ಸೂಚನೆಗಳು",
        "hi": "प्राथमिक उपचार निर्देश",
    },
    "Veterinary alert draft": {
        "kn": "ಪಶುವೈದ್ಯರ ಎಚ್ಚರಿಕೆ ಕರಡು",
        "hi": "पशु चिकित्सक अलर्ट ड्राफ्ट",
    },
    "Any drooling, lameness, or mouth sores?": {
        "kn": "ಯಾವುದಾದರೂ ಲಾಲಾರಸ ಸ್ರಾವ, ಕುಂಟು ನಡೆ, ಅಥವಾ ಬಾಯಿಯ ಹುಣ್ಣುಗಳು?",
        "hi": "क्या लार टपकना, लंगड़ापन, या मुंह के छाले हैं?",
    },
    "What symptoms have you noticed in your {animal}? For example: fever, drooling, or not eating.": {
        "kn": "ನಿಮ್ಮ {animal} ನಲ್ಲಿ ನೀವು ಯಾವ ಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿದ್ದೀರಿ? ಉದಾಹರಣೆ: ಜ್ವರ, ಲಾಲಾರಸ, ಅಥವಾ ಆಹಾರ ತಿನ್ನದಿರುವುದು.",
        "hi": "आपने अपने {animal} में क्या लक्षण देखे? उदाहरण: बुखार, लार टपकना, या खाना न खाना।",
    },
}


class StaticPhraseTranslationProvider(TranslationProvider):
    """Exact-phrase translations for orchestrator copy — no mock prefixes."""

    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        source = (request.source_language or TargetLanguage.EN).value
        target = request.target_language.value
        text = request.text

        if target == TargetLanguage.EN.value and source == TargetLanguage.EN.value:
            return TranslateResponse(
                translated_text=text,
                source_language=source,
                target_language=target,
            )

        templated = try_template_translate(text, target, source)
        if templated:
            logger.info(
                "Template translation target=%s src=%s len=%d",
                target,
                source,
                len(text),
            )
            return TranslateResponse(
                translated_text=templated,
                source_language=source,
                target_language=target,
            )

        if target == TargetLanguage.EN.value:
            raise LookupError(f"No template translation to en for source={source}")

        if text in PHRASE_TRANSLATIONS:
            localized = PHRASE_TRANSLATIONS[text].get(target)
            if localized:
                logger.info(
                    "Static phrase translation target=%s len=%d",
                    target,
                    len(text),
                )
                return TranslateResponse(
                    translated_text=localized,
                    source_language=source,
                    target_language=target,
                )

        for template, translations in PHRASE_TRANSLATIONS.items():
            if "{" not in template:
                continue
            localized_template = translations.get(target)
            if not localized_template:
                continue
            prefix = template.split("{", 1)[0]
            suffix = template.split("}", 1)[-1]
            if text.startswith(prefix.rstrip(" ")) and text.endswith(suffix):
                inner = text[len(prefix) : len(text) - len(suffix) if suffix else None]
                translated = localized_template.format(animal=inner)
                return TranslateResponse(
                    translated_text=translated,
                    source_language=source,
                    target_language=target,
                )

        logger.warning(
            "Static phrase translation miss target=%s text=%r",
            target,
            text[:80],
        )
        raise LookupError(f"No static translation for target={target}")


class ChainedTranslationProvider(TranslationProvider):
    """Try providers in order; last provider must succeed."""

    def __init__(self, providers: list[TranslationProvider]) -> None:
        if not providers:
            raise ValueError("At least one provider required")
        self._providers = providers
        self.chain_name = " -> ".join(type(p).__name__ for p in providers)

    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        for provider in self._providers[:-1]:
            try:
                return await provider.translate(request)
            except LookupError:
                continue
            except Exception as exc:
                logger.warning(
                    "%s failed (%s), trying next provider",
                    type(provider).__name__,
                    exc,
                )
                continue

        return await self._providers[-1].translate(request)
