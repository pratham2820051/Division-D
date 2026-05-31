from fastapi import APIRouter, HTTPException

from features.chat.schemas.request import CreateChatRequest, RenameChatRequest, SendMessageRequest
from features.chat.schemas.response import (
    ChatDetailResponse,
    ChatListResponse,
    ChatSummaryResponse,
    DeleteChatResponse,
    SendMessageResponse,
    SmsDraftResponse,
)
from features.chat.services.chat_service import chat_service
from features.memory.schemas.chat import MessageSchema
from shared.exceptions import NotFoundError

router = APIRouter()


def _not_found(exc: NotFoundError) -> HTTPException:
    return HTTPException(status_code=404, detail=str(exc))


def _chat_summary(chat) -> ChatSummaryResponse:
    return ChatSummaryResponse(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        message_count=len(chat.messages),
    )


@router.post("/create", response_model=ChatSummaryResponse, status_code=201)
def create_chat(body: CreateChatRequest | None = None):
    title = body.title if body else "New chat"
    chat = chat_service.create_chat(title=title)
    return _chat_summary(chat)


@router.get("/list", response_model=ChatListResponse)
def list_chats():
    chats = chat_service.list_chats()
    summaries = [_chat_summary(c) for c in chats]
    return ChatListResponse(chats=summaries, total=len(summaries))


@router.get("/{chat_id}", response_model=ChatDetailResponse)
def get_chat(chat_id: str):
    try:
        chat = chat_service.get_chat(chat_id)
    except NotFoundError as exc:
        raise _not_found(exc) from exc

    return ChatDetailResponse(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        messages=[MessageSchema.model_validate(m) for m in chat.messages],
    )


@router.post("/{chat_id}/message", response_model=SendMessageResponse)
def send_message(chat_id: str, body: SendMessageRequest):
    try:
        result = chat_service.send_message(
            chat_id,
            body.message,
            language=body.language,
            voice_metadata=body.voice_metadata,
        )
    except NotFoundError as exc:
        raise _not_found(exc) from exc

    return SendMessageResponse(
        chat_id=result["chat_id"],
        user_message=MessageSchema.model_validate(result["user_message"]),
        assistant_message=MessageSchema.model_validate(result["assistant_message"]),
        assistant_messages=[
            MessageSchema.model_validate(m) for m in result["assistant_messages"]
        ],
        blocks=result["blocks"],
        reply=result["reply"],
        severity=result["severity"],
        confidence=result["confidence"],
        disease=result["disease"],
        first_aid=result["first_aid"],
        follow_up_question=result["follow_up_question"],
        language=result["language"],
    )


@router.post("/{chat_id}/sms-draft", response_model=SmsDraftResponse)
def generate_sms_draft(chat_id: str, language: str = "en"):
    try:
        result = chat_service.generate_sms_draft(chat_id, language=language)
    except NotFoundError as exc:
        raise _not_found(exc) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return SmsDraftResponse(
        chat_id=result["chat_id"],
        assistant_message=MessageSchema.model_validate(result["assistant_message"]),
        language=result["language"],
    )


@router.delete("/{chat_id}", response_model=DeleteChatResponse)
def delete_chat(chat_id: str):
    try:
        chat_service.delete_chat(chat_id)
    except NotFoundError as exc:
        raise _not_found(exc) from exc
    return DeleteChatResponse(chat_id=chat_id)


@router.patch("/{chat_id}/rename", response_model=ChatSummaryResponse)
def rename_chat(chat_id: str, body: RenameChatRequest):
    try:
        chat = chat_service.rename_chat(chat_id, body.title)
    except NotFoundError as exc:
        raise _not_found(exc) from exc
    return _chat_summary(chat)
