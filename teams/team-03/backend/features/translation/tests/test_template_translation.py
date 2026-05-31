"""Tests for offline template translation (Groq fallback)."""

from features.translation.services.template_translation import try_template_translate


def test_gathering_intro_dynamic_hindi() -> None:
    text = (
        "Based on fever, bloody discharge, Mastitis is one possibility. "
        "I need one more detail to narrow it down."
    )
    result = try_template_translate(text, "hi", "en")
    assert result is not None
    assert "बुखार" in result or "रक्त" in result
    assert "Mastitis" in result or "स्तन" in result or "मास्ट" in result


def test_gathering_intro_dynamic_kannada() -> None:
    text = (
        "Based on fever, drooling, Foot and Mouth Disease is one possibility. "
        "I need one more detail to narrow it down."
    )
    result = try_template_translate(text, "kn", "en")
    assert result is not None
    assert "ಜ್ವರ" in result or "ಲಾಲ" in result


def test_hindi_to_english_gathering_intro() -> None:
    hi = "रोग की पहचान के लिए मुझे कुछ प्रश्न पूछने हैं।"
    result = try_template_translate(hi, "en", "hi")
    assert result is not None
    assert "questions" in result.lower()
