"""Template and dictionary translation when Groq/API is unavailable."""

from __future__ import annotations

import re

_GATHERING_INTRO_DYNAMIC = re.compile(
    r"Based on (.+), (.+) is one possibility\. I need one more detail to narrow it down\.",
    re.IGNORECASE,
)

# English term -> {hi, kn} for inline symptom/disease labels
TERM_UI: dict[str, dict[str, str]] = {
    "fever": {"hi": "बुखार", "kn": "ಜ್ವರ"},
    "high fever": {"hi": "तेज बुखार", "kn": "ಹೆಚ್ಚಿನ ಜ್ವರ"},
    "drooling": {"hi": "लार टपकना", "kn": "ಲಾಲಾರಸ ಸ್ರಾವ"},
    "excessive salivation and drooling": {
        "hi": "अत्यधिक लार और लार टपकना",
        "kn": "ಅತಿಯಾದ ಲಾಲಾರಸ ಮತ್ತು ಲಾಲಾರಸ ಸ್ರಾವ",
    },
    "bloody discharge": {"hi": "रक्तस्राव", "kn": "ರಕ್ತಸ್ರಾವ"},
    "bloody discharge from natural openings": {
        "hi": "प्राकृतिक छिद्रों से रक्तस्राव",
        "kn": "ಸ್ವಾಭಾವಿಕ ರಂಧ್ರಗಳಿಂದ ರಕ್ತಸ್ರಾವ",
    },
    "reduced appetite": {"hi": "भूख कम होना", "kn": "ಹಸಿವು ಕಡಿಮೆಯಾಗುವುದು"},
    "lameness": {"hi": "लंगड़ापन", "kn": "ಕುಂಟು ನಡೆ"},
    "lameness and reluctance to walk": {
        "hi": "लंगड़ापन और चलने में अनिच्छा",
        "kn": "ಕುಂಟು ನಡೆ ಮತ್ತು ನಡೆಯಲು ಅಸ್ವೀಕಾರ",
    },
    "difficulty breathing": {"hi": "सांस लेने में कठिनाई", "kn": "ಊಸಿ ಆಡುವಲ್ಲಿ ತೊಂದರೆ"},
    "weakness and lethargy": {"hi": "कमजोरी और सुस्ती", "kn": "ದುರ್ಬಲತೆ ಮತ್ತು ಸುಸ್ತು"},
    "swollen painful udder quarter": {
        "hi": "सूजा हुआ दर्दनाक थन",
        "kn": "ನೋವಿನ ಜೊತೆ ಊದಿದ ಹಿಂದು",
    },
    "reduced milk yield": {"hi": "दूध उत्पादन में कमी", "kn": "ಹಾಲು ಉತ್ಪಾದನೆ ಕಡಿಮೆ"},
    "mastitis": {"hi": "स्तनाग्राह (मास्टाइटिस)", "kn": "ಮಾಸ್ಟಿಟಿಸ್"},
    "foot and mouth disease": {"hi": "मुंह और खुर रोग", "kn": "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ"},
    "fmd": {"hi": "मुंह और खुर रोग", "kn": "ಕಾಲು ಮತ್ತು ಬಾಯಿ ರೋಗ"},
    "cow": {"hi": "गाय", "kn": "ಹಸು"},
    "cattle": {"hi": "पशु", "kn": "ಪಶು"},
    "buffalo": {"hi": "भैंस", "kn": "ಎಮ್ಮೆ"},
    "goat": {"hi": "बकरी", "kn": "ಮೇಕೆ"},
    "sheep": {"hi": "भेड़", "kn": "ಕುರಿ"},
    "animal": {"hi": "जानवर", "kn": "ಪ್ರಾಣಿ"},
}


def _translate_terms_inline(fragment: str, target: str) -> str:
    """Translate comma-separated English symptom/disease labels."""
    if target not in {"hi", "kn"}:
        return fragment

    parts = [p.strip() for p in fragment.split(",") if p.strip()]
    translated: list[str] = []
    for part in parts:
        key = part.lower()
        entry = TERM_UI.get(key)
        if entry and target in entry:
            translated.append(entry[target])
        else:
            replaced = part
            for term, langs in sorted(TERM_UI.items(), key=lambda x: -len(x[0])):
                if term in key and target in langs:
                    replaced = langs[target]
                    break
            translated.append(replaced)
    return ", ".join(translated)


def try_template_translate(text: str, target: str, source: str = "en") -> str | None:
    """
    Return translated text for known templates and term lists, or None if no match.
    Supports en↔hi and en↔kn for demo without Groq.
    """
    if not text.strip():
        return text

    target = target.split("-")[0].lower()
    source = (source or "en").split("-")[0].lower()

    if source == target:
        return text

    # Lazy imports avoid circular dependency with chat.localization
    from features.chat.utils.farmer_messages import (
        FARMER_MESSAGES,
        farmer_message,
        localize_system_message,
    )
    from features.chat.utils.diagnosis_flow import GATHERING_INTRO_TEXT
    from features.translation.services.static_translation_provider import PHRASE_TRANSLATIONS

    # Reverse: native script -> English (template keys only)
    if target == "en" and source in {"hi", "kn"}:
        for translations in FARMER_MESSAGES.values():
            en = translations.get("en", "")
            localized = translations.get(source, "")
            if localized and text.strip() == localized.strip():
                return en
            if "{" in en and localized:
                prefix = en.split("{", 1)[0]
                suffix = en.split("}", 1)[-1]
                loc_prefix = localized.split("{", 1)[0]
                loc_suffix = localized.split("}", 1)[-1]
                if text.startswith(loc_prefix.rstrip()) and text.endswith(loc_suffix):
                    inner = text[len(loc_prefix) : len(text) - len(loc_suffix) if loc_suffix else None]
                    return en.format(animal=inner)
        return None

    if target not in {"hi", "kn"}:
        return None

    stripped = text.strip()

    system = localize_system_message(stripped, target)
    if system != stripped:
        return system

    if stripped == GATHERING_INTRO_TEXT:
        return farmer_message("gathering_intro", target)

    if stripped.startswith("Preliminary assessment for your ") and stripped.endswith("."):
        animal = stripped[len("Preliminary assessment for your ") : -1]
        animal_local = _translate_terms_inline(animal, target)
        if target == "hi":
            return f"आपके {animal_local} के लिए प्रारंभिक आकलन।"
        return f"ನಿಮ್ಮ {animal_local} ಗಾಗಿ ಪ್ರಾಥಮಿಕ ಮೌಲ್ಯಮಾಪನ."

    dynamic = _GATHERING_INTRO_DYNAMIC.match(stripped)
    if dynamic:
        symptoms_en = dynamic.group(1).strip()
        disease_en = dynamic.group(2).strip()
        symptoms = _translate_terms_inline(symptoms_en, target)
        disease = _translate_terms_inline(disease_en, target)
        return farmer_message(
            "gathering_intro_dynamic",
            target,
            symptoms=symptoms,
            disease=disease,
        )

    if stripped in PHRASE_TRANSLATIONS:
        localized = PHRASE_TRANSLATIONS[stripped].get(target)
        if localized:
            return localized

    for template, translations in PHRASE_TRANSLATIONS.items():
        if "{" not in template:
            continue
        localized_template = translations.get(target)
        if not localized_template:
            continue
        prefix = template.split("{", 1)[0]
        suffix = template.split("}", 1)[-1]
        if stripped.startswith(prefix.rstrip(" ")) and stripped.endswith(suffix):
            inner = stripped[len(prefix) : len(stripped) - len(suffix) if suffix else None]
            return localized_template.format(animal=inner)

    key = stripped.lower()
    if key in TERM_UI and target in TERM_UI[key]:
        return TERM_UI[key][target]

    return None
