"""In-memory chat storage (hackathon — swap for database later)."""

from threading import Lock

from features.memory.models.chat import Chat, Message
from shared.exceptions import NotFoundError


class InMemoryChatStore:
    def __init__(self) -> None:
        self._chats: dict[str, Chat] = {}
        self._lock = Lock()

    def save_chat(self, chat: Chat) -> Chat:
        with self._lock:
            self._chats[chat.id] = chat
            return chat

    def get_chat(self, chat_id: str) -> Chat:
        with self._lock:
            chat = self._chats.get(chat_id)
            if chat is None:
                raise NotFoundError(f"Chat {chat_id} not found")
            return chat

    def list_chats(self) -> list[Chat]:
        with self._lock:
            return list(self._chats.values())

    def delete_chat(self, chat_id: str) -> None:
        with self._lock:
            if chat_id not in self._chats:
                raise NotFoundError(f"Chat {chat_id} not found")
            del self._chats[chat_id]

    def append_message(self, chat_id: str, message: Message) -> Message:
        with self._lock:
            chat = self._chats.get(chat_id)
            if chat is None:
                raise NotFoundError(f"Chat {chat_id} not found")
            chat.messages.append(message)
            chat.updated_at = message.timestamp
            return message


# Process-wide singleton for in-memory persistence
chat_store = InMemoryChatStore()
