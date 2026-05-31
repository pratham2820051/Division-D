from pydantic import BaseModel


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str = "en"
    target_language: str
