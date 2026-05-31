"""Shared Groq client helpers with retry logic."""

from __future__ import annotations

import os
import time
from typing import Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_RETRIES = 3
RETRY_BACKOFF_SEC = 2.0


def get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GROQ_API_KEY is not set. Add it to a .env file in the project root."
        )
    return Groq(api_key=api_key)


def _is_retryable(exc: Exception) -> bool:
    status = getattr(exc, "status_code", None)
    if status in (429, 500, 502, 503, 504):
        return True
    name = type(exc).__name__.lower()
    return "ratelimit" in name or "timeout" in name or "connection" in name


def create_chat_completion(**kwargs: Any) -> Any:
    """Call Groq chat completions with exponential backoff on transient errors."""
    client = get_client()
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as exc:
            last_error = exc
            if attempt >= MAX_RETRIES - 1 or not _is_retryable(exc):
                raise
            time.sleep(RETRY_BACKOFF_SEC * (2**attempt))

    if last_error:
        raise last_error
    raise RuntimeError("Groq chat completion failed without an exception.")
