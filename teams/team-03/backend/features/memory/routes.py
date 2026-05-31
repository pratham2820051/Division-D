from fastapi import APIRouter, HTTPException, Query

from features.memory.schemas.chat import ChatDetailSchema, ContextResponse, MessageSchema
from features.memory.services.memory_service import memory_service
from shared.exceptions import NotFoundError

router = APIRouter()


def _handle_not_found(exc: NotFoundError) -> HTTPException:
    return HTTPException(status_code=404, detail=str(exc))


@router.get("/{chat_id}/history", response_model=list[MessageSchema])
def get_chat_history(chat_id: str):
    try:
        return memory_service.get_chat_history(chat_id)
    except NotFoundError as exc:
        raise _handle_not_found(exc) from exc


@router.get("/{chat_id}/context", response_model=ContextResponse)
def get_recent_context(
    chat_id: str,
    limit: int = Query(default=20, ge=1, le=100),
):
    try:
        messages = memory_service.get_recent_context(chat_id, limit=limit)
        return ContextResponse(chat_id=chat_id, messages=messages, limit=limit)
    except NotFoundError as exc:
        raise _handle_not_found(exc) from exc
