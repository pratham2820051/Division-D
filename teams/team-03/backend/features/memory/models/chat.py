"""Domain models for conversation memory."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Message:
    id: str
    chat_id: str
    role: MessageRole
    content: str
    timestamp: datetime = field(default_factory=utcnow)
    message_type: str = "text"
    payload: dict | None = None


@dataclass
class Chat:
    id: str
    title: str
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)
    messages: list[Message] = field(default_factory=list)


def new_chat(title: str = "New chat") -> Chat:
    return Chat(id=str(uuid4()), title=title)


def new_message(
    chat_id: str,
    role: MessageRole,
    content: str,
    *,
    message_type: str = "text",
    payload: dict | None = None,
) -> Message:
    return Message(
        id=str(uuid4()),
        chat_id=chat_id,
        role=role,
        content=content,
        message_type=message_type,
        payload=payload,
    )
