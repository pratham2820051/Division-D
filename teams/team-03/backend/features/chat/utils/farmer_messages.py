"""Pre-localized farmer-facing system messages (no translate-to-English round trip)."""

from __future__ import annotations

import re

from features.chat.utils.conversation_language import normalize_language_code
from features.chat.utils.domain_classifier import DOMAIN_GUARDRAIL_TEXT
from features.chat.utils.supported_animals import UNSUPPORTED_ANIMAL_MESSAGE
from features.chat.utils.diagnosis_flow import (
    GATHERING_INTRO_TEXT,
    MORE_SYMPTOMS_TEXT,
    VOICE_LANGUAGE_MISMATCH_TEMPLATE,
    VOICE_UNCLEAR_TEXT,
)

FARMER_MESSAGES: dict[str, dict[str, str]] = {
    "voice_unclear": {
        "en": "I could not clearly understand the audio. Please try again.",
        "kn": "ನಾನು ಆಡಿಯೋವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
        "hi": "मैं ऑडियो को स्पष्ट रूप से समझ नहीं पाया। कृपया पुनः प्रयास करें।",
        "te": "నేను ఆడియోను స్పష్టంగా అర్థం చేసుకోలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.",
        "ta": "நான் ஆடியோவை தெளிவாகப் புரிந்து கொள்ளவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
        "mr": "मला ऑडिओ स्पष्टपणे समजला नाही. कृपया पुन्हा प्रयत्न करा.",
        "ml": "എനിക്ക് ഓഡിയോ വ്യക്തമായി മനസ്സിലായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
        "ur": "میں آڈیو کو واضح طور پر نہیں سمجھ سکا۔ براہ کرم دوبارہ کوشش کریں۔",
    },
    "voice_language_mismatch": {
        "en": (
            "It sounds like you spoke in {detected}, but {selected} is selected. "
            "Please confirm the language or try again."
        ),
        "kn": (
            "ನೀವು {detected} ನಲ್ಲಿ ಮಾತನಾಡಿದ್ದೀರಿ, ಆದರೆ {selected} ಆಯ್ಕೆಯಾಗಿದೆ. "
            "ದಯವಿಟ್ಟು ಭಾಷೆಯನ್ನು ದೃಢೀಕರಿಸಿ ಅಥವಾ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
        ),
        "hi": (
            "ऐसा लगता है कि आपने {detected} में बोला, लेकिन {selected} चुना गया है। "
            "कृपया भाषा की पुष्टि करें या पुनः प्रयास करें।"
        ),
    },
    "domain_guardrail": {
        "en": DOMAIN_GUARDRAIL_TEXT,
        "kn": "ನಾನು ಪಶು ಆರೋಗ್ಯ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ಪ್ರಾಣಿ ಮತ್ತು ಅದರ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ.",
        "hi": "मैं एक पशु स्वास्थ्य सहायक हूँ। कृपया जानवर और उसके लक्षणों का वर्णन करें।",
        "te": "నేను పశు ఆరోగ్య సహాయకుడిని. దయచేసి జంతువు మరియు దాని లక్షణాలను వివరించండి.",
        "ta": "நான் கால்நடை சுகாதார உதவியாளர். விலங்கு மற்றும் அதன் அறிகுறிகளை விவரிக்கவும்.",
        "mr": "मी पशु आरोग्य सहायक आहे. कृपया प्राणी आणि त्याची लक्षणे वर्णन करा.",
        "ml": "ഞാൻ ഒരു കന്നുകാലി ആരോഗ്യ സഹായി ആണ്. മൃഗത്തെയും അതിന്റെ ലക്ഷണങ്ങളും വിവരിക്കുക.",
        "ur": "میں مویشیوں کی صحت کا معاون ہوں۔ براہ کرم جانور اور اس کی علامات بیان کریں۔",
    },
    "gathering_intro": {
        "en": GATHERING_INTRO_TEXT,
        "kn": "ರೋಗವನ್ನು ಗುರುತಿಸಲು ನಾನು ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ.",
        "hi": "रोग की पहचान के लिए मुझे कुछ प्रश्न पूछने हैं।",
    },
    "more_symptoms": {
        "en": MORE_SYMPTOMS_TEXT,
        "kn": "ದಯವಿಟ್ಟು ನೀವು ಗಮನಿಸಿದ ಇತರ ಲಕ್ಷಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.",
        "hi": "कृपया आपने देखे अन्य लक्षण साझा करें।",
    },
    "gathering_intro_dynamic": {
        "en": "Based on {symptoms}, {disease} is one possibility. I need one more detail to narrow it down.",
        "hi": "{symptoms} के आधार पर, {disease} एक संभावना है। मुझे इसे संकीर्ण करने के लिए एक और विवरण चाहिए।",
        "kn": "{symptoms} ಆಧಾರದ ಮೇಲೆ, {disease} ಒಂದು ಸಂಭವನೀಯತೆ. ಇನ್ನೂ ಒಂದು ವಿವರ ಬೇಕು.",
    },
    "unsupported_animal": {
        "en": UNSUPPORTED_ANIMAL_MESSAGE,
        "kn": (
            "ಪ್ರಸ್ತುತ PashuMitra AI ಗೆ ಹಸು, ಎಮ್ಮೆ, ಮೇಕೆ ಮತ್ತು ಕುರಿ ಮಾತ್ರ ಬೆಂಬಲಿತ."
        ),
        "hi": (
            "वर्तमान में PashuMitra AI केवल गाय, भैंस, बकरी और भेड़ का समर्थन करता है।"
        ),
    },
}

# Keep orchestrator English constants aligned with farmer_messages English entries.
assert FARMER_MESSAGES["voice_unclear"]["en"] == (
    "I could not clearly understand the audio. Please try again."
)

_LANGUAGE_MISMATCH_PATTERN = re.compile(
    r"It sounds like you spoke in (?P<detected>\w+), but (?P<selected>\w+) is selected",
    re.IGNORECASE,
)

_GATHERING_INTRO_DYNAMIC = re.compile(
    r"Based on (.+), (.+) is one possibility\. I need one more detail to narrow it down\.",
    re.IGNORECASE,
)


def farmer_message(key: str, language: str, **kwargs: str) -> str:
    lang = normalize_language_code(language) or "en"
    templates = FARMER_MESSAGES.get(key, {})
    template = templates.get(lang) or templates.get("en", "")
    if kwargs:
        return template.format(**kwargs)
    return template


def localize_system_message(english_text: str, language: str) -> str:
    """Replace known English system strings with pre-localized farmer copy."""
    lang = normalize_language_code(language) or "en"
    if lang == "en":
        return english_text

    if english_text == VOICE_UNCLEAR_TEXT or english_text == FARMER_MESSAGES["voice_unclear"]["en"]:
        return farmer_message("voice_unclear", lang)

    if english_text == DOMAIN_GUARDRAIL_TEXT:
        return farmer_message("domain_guardrail", lang)

    if english_text == UNSUPPORTED_ANIMAL_MESSAGE:
        return farmer_message("unsupported_animal", lang)

    if english_text == GATHERING_INTRO_TEXT:
        return farmer_message("gathering_intro", lang)

    if english_text == MORE_SYMPTOMS_TEXT:
        return farmer_message("more_symptoms", lang)

    mismatch = _LANGUAGE_MISMATCH_PATTERN.search(english_text)
    if mismatch or english_text.startswith("It sounds like you spoke in"):
        detected = mismatch.group("detected") if mismatch else "another language"
        selected = mismatch.group("selected") if mismatch else lang
        localized = farmer_message(
            "voice_language_mismatch",
            lang,
            detected=detected,
            selected=selected,
        )
        if localized:
            return localized
        return VOICE_LANGUAGE_MISMATCH_TEMPLATE.format(
            detected=detected,
            selected=selected,
        )

    return english_text
