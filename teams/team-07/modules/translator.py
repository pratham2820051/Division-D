from deep_translator import GoogleTranslator

def translate_to_kannada(text):

    translated = GoogleTranslator(
        source='auto',
        target='kn'
    ).translate(text)

    return translated