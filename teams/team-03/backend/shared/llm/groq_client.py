"""Groq LLM client wrapper (OpenAI-compatible chat completions API)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

import httpx

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqClientError(Exception):
    """Raised when the Groq API returns an error or the response is unusable."""


@dataclass(frozen=True)
class GroqChatMessage:
    role: str
    content: str


class GroqHTTPClient(Protocol):
    def post(self, url: str, **kwargs: Any) -> httpx.Response: ...


class GroqClient:
    """Thin wrapper around Groq chat completions for structured LLM calls."""

    def __init__(
        self,
        *,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        max_tokens: int = 1024,
        temperature: float = 0.1,
        timeout_seconds: float = 30.0,
        http_client: GroqHTTPClient | None = None,
    ) -> None:
        if not api_key:
            raise GroqClientError("GROQ_API_KEY is not configured.")
        self._api_key = api_key
        self._model = model
        self._max_tokens = max_tokens
        self._temperature = temperature
        self._timeout = timeout_seconds
        self._http = http_client or httpx.Client(timeout=timeout_seconds)

    def chat_completion(
        self,
        messages: list[GroqChatMessage],
        *,
        json_mode: bool = True,
    ) -> str:
        """Return the assistant message content from a chat completion."""
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            response = self._http.post(
                GROQ_CHAT_COMPLETIONS_URL,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        except httpx.TimeoutException as exc:
            raise GroqClientError("Groq request timed out.") from exc
        except httpx.HTTPError as exc:
            raise GroqClientError(f"Groq HTTP error: {exc}") from exc

        if response.status_code >= 400:
            raise GroqClientError(
                f"Groq API error ({response.status_code}): {response.text[:500]}"
            )

        try:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as exc:
            raise GroqClientError("Groq response missing assistant content.") from exc
