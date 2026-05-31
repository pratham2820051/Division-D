from fastapi import APIRouter
import logging

from features.translation.schemas.request import TranslateRequest
from features.translation.schemas.response import TranslateResponse
from features.translation.services.translation_service import translation_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/translate", response_model=TranslateResponse)
async def translate(body: TranslateRequest):
    source = (body.source_language.value if body.source_language else "en")
    target = body.target_language.value
    result = await translation_service.translate(body)
    logger.info(
        "translation API src=%s tgt=%s in_len=%d out_len=%d out_preview=%r",
        source,
        target,
        len(body.text),
        len(result.translated_text),
        result.translated_text[:120],
    )
    return result
