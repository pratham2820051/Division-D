from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class MessageRoleSchema(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class MessageSchema(BaseModel):
    id: str
    chat_id: str
    role: MessageRoleSchema
    content: str
    timestamp: datetime
    message_type: str = "text"
    payload: dict | None = None

    model_config = {"from_attributes": True}


class ChatSchema(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatDetailSchema(ChatSchema):
    messages: list[MessageSchema] = Field(default_factory=list)


class AddMessageRequest(BaseModel):
    role: MessageRoleSchema
    content: str = Field(..., min_length=1)


class RenameChatRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class ContextResponse(BaseModel):
    chat_id: str
    messages: list[MessageSchema]
    limit: int
