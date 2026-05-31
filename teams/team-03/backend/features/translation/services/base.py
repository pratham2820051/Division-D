"""Translation provider interface — swap mock for real API/LLM later."""

from abc import ABC, abstractmethod

from features.translation.schemas.request import TranslateRequest
from features.translation.schemas.response import TranslateResponse


class TranslationProvider(ABC):
    @abstractmethod
    async def translate(self, request: TranslateRequest) -> TranslateResponse:
        """Translate text to the target language."""
