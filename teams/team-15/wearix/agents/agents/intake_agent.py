"""
Ticket Intake Agent (Team D15).
Ingests raw support tickets, extracts customer metadata (name, email, order ID),
and cleanses/normalizes the body text.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.groq_utils import DEFAULT_MODEL, create_chat_completion

SYSTEM_PROMPT = """You are a Ticket Intake Agent for ShopEase.
Your job is to parse incoming raw customer support messages, clean them, and extract key metadata.

Provide response in JSON format only with these keys:
{
  "customer_name": "extracted name or 'Valued Customer' if unknown",
  "customer_email": "extracted email or generated 'name@wearix.com' (lowercased without spaces) if unknown",
  "order_id": "extracted order ID matching ORD-XXXXX pattern or 'N/A' if unknown",
  "cleaned_text": "the message text stripped of greetings, salutations, and signatures"
}"""


def parse_intake(text: str, *, model: str | None = None) -> dict[str, Any]:
    """
    Parses a raw support query to extract customer metadata and clean the body text.
    """
    prompt = f"Raw support query:\n\"\"\n{text}\n\"\""
    
    response = create_chat_completion(
        model=model or DEFAULT_MODEL,
        temperature=0.1,
        max_tokens=300,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    raw = (response.choices[0].message.content or "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            return json.loads(match.group())
        raise
