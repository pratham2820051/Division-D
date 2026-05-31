
from deep_translator import GoogleTranslator

def translate_text(text):

    try:

        kannada = GoogleTranslator(
            source='auto',
            target='kn'
        ).translate(text)

        hindi = GoogleTranslator(
            source='auto',
            target='hi'
        ).translate(text)

        return {
            "kannada": kannada,
            "hindi": hindi
        }

    except Exception as e:

        return {
            "kannada": f"Translation Error: {e}",
            "hindi": f"Translation Error: {e}"
        }
