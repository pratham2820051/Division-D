from datetime import datetime

from pydantic import BaseModel, Field

from features.chat.schemas.messages import AssistantBlock, Severity
from features.memory.schemas.chat import MessageSchema


class ChatSummaryResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ChatListResponse(BaseModel):
    chats: list[ChatSummaryResponse]
    total: int


class ChatDetailResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageSchema] = Field(default_factory=list)


class SendMessageResponse(BaseModel):
    chat_id: str
    user_message: MessageSchema
    assistant_message: MessageSchema
    assistant_messages: list[MessageSchema] = Field(default_factory=list)
    blocks: list[AssistantBlock] = Field(default_factory=list)
    reply: str
    severity: Severity | None = None
    confidence: float = 0.0
    disease: str | None = None
    first_aid: str | None = None
    follow_up_question: str | None = None
    language: str = "en"


class DeleteChatResponse(BaseModel):
    deleted: bool = True
    chat_id: str


class SmsDraftResponse(BaseModel):
    chat_id: str
    assistant_message: MessageSchema
    language: str = "en"
