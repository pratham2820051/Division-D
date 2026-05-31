"""Conversation memory service — single source of truth for chat storage."""

from config.settings import settings
from features.memory.models.chat import Chat, Message, MessageRole, new_chat, new_message, utcnow
from features.memory.models.store import InMemoryChatStore, chat_store
from shared.exceptions import NotFoundError


def _derive_title(content: str) -> str:
    trimmed = content.strip()
    if not trimmed:
        return "New chat"
    return trimmed[:36] + "…" if len(trimmed) > 36 else trimmed


def _to_chat_schema(chat: Chat) -> dict:
    return {
        "id": chat.id,
        "title": chat.title,
        "created_at": chat.created_at,
        "updated_at": chat.updated_at,
        "message_count": len(chat.messages),
    }


class MemoryService:
    def __init__(self, store: InMemoryChatStore | None = None) -> None:
        self._store = store or chat_store

    def create_chat(self, title: str = "New chat") -> Chat:
        chat = new_chat(title=title)
        return self._store.save_chat(chat)

    def add_message(
        self,
        chat_id: str,
        role: MessageRole,
        content: str,
        *,
        auto_title: bool = True,
        message_type: str = "text",
        payload: dict | None = None,
    ) -> Message:
        chat = self._store.get_chat(chat_id)
        message = new_message(
            chat_id,
            role,
            content.strip(),
            message_type=message_type,
            payload=payload,
        )
        self._store.append_message(chat_id, message)

        if auto_title and role == MessageRole.USER and len(chat.messages) == 0:
            chat.title = _derive_title(content)
            chat.updated_at = utcnow()
            self._store.save_chat(chat)

        return message

    def get_chat_history(self, chat_id: str) -> list[Message]:
        chat = self._store.get_chat(chat_id)
        return list(chat.messages)

    def get_recent_context(
        self,
        chat_id: str,
        limit: int | None = None,
    ) -> list[Message]:
        limit = limit or settings.max_context_messages
        messages = self.get_chat_history(chat_id)
        return messages[-limit:] if limit > 0 else messages

    def delete_chat(self, chat_id: str) -> None:
        self._store.delete_chat(chat_id)

    def get_chat(self, chat_id: str) -> Chat:
        return self._store.get_chat(chat_id)

    def list_chats(self) -> list[Chat]:
        chats = self._store.list_chats()
        return sorted(chats, key=lambda c: c.updated_at, reverse=True)

    def rename_chat(self, chat_id: str, title: str) -> Chat:
        chat = self._store.get_chat(chat_id)
        chat.title = title.strip()
        chat.updated_at = utcnow()
        return self._store.save_chat(chat)

    def chat_exists(self, chat_id: str) -> bool:
        try:
            self._store.get_chat(chat_id)
            return True
        except NotFoundError:
            return False


memory_service = MemoryService()
