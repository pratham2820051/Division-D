import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from features.voice.schemas.request import SpeakRequest
from features.voice.schemas.response import TranscribeResponse
from features.voice.services.base import STTProviderError
from features.voice.services.sarvam_stt_provider import SarvamSTTTimeoutError
from features.voice.services.voice_service import voice_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(...),
    language: str | None = Form(None),
):
    audio_bytes = await audio.read()
    logger.info(
        "voice/transcribe received filename=%s bytes=%d language=%s",
        audio.filename,
        len(audio_bytes),
        language,
    )
    if not audio_bytes or len(audio_bytes) < 256:
        raise HTTPException(
            status_code=400,
            detail="Audio file is empty or too short. Record again and speak for a moment.",
        )
    try:
        result = await voice_service.transcribe(
            audio_bytes,
            filename=audio.filename,
            language=language,
        )
    except SarvamSTTTimeoutError as exc:
        logger.warning("voice/transcribe timeout: %s", exc)
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except STTProviderError as exc:
        logger.warning("voice/transcribe provider error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    logger.info(
        "voice/transcribe completed provider=%s lang=%s text_len=%d",
        result.provider,
        result.language,
        len(result.text or ""),
    )

    return TranscribeResponse(
        text=result.text,
        language=result.language,
        confidence=result.confidence,
        language_confidence=result.language_confidence,
        provider=result.provider,
        fallback_used=result.fallback_used,
        requested_language=result.requested_language,
        detected_language=result.detected_language,
    )


@router.post("/speak")
async def speak(body: SpeakRequest):
    result = await voice_service.speak(body.text, language=body.language)

    headers = {
        "Content-Disposition": 'inline; filename="speech.wav"',
        "X-Audio-Duration": str(result.duration_seconds),
    }
    if result.voice:
        headers["X-TTS-Voice"] = result.voice
    if result.language:
        headers["X-TTS-Language"] = result.language

    return Response(
        content=result.audio_bytes,
        media_type=result.content_type,
        headers=headers,
    )


# Alias for frontend compatibility
@router.post("/synthesize")
async def synthesize(body: SpeakRequest):
    return await speak(body)
