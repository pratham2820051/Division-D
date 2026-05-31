from enum import Enum

from pydantic import BaseModel, Field


class TargetLanguage(str, Enum):
    EN = "en"
    KN = "kn"
    HI = "hi"
    TE = "te"
    TA = "ta"
    ML = "ml"
    UR = "ur"


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    target_language: TargetLanguage
    source_language: TargetLanguage | None = None
