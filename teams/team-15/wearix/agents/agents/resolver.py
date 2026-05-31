"""
Tier-1 Resolution Agent (Member 2 — Groq Agents).

Input schema (frozen):  {"intent": str, "text": str}
Output: professional customer-facing reply (str)
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.groq_utils import DEFAULT_MODEL, create_chat_completion

# Frozen schema — hardcoded mock inputs (Bitext-aligned Tier-1 samples)
MOCK_TIER1_INPUTS: list[dict[str, str]] = [
    {
        "intent": "cancel_order",
        "text": "I need to cancel purchase ORD-10482. It has not shipped yet.",
    },
    {
        "intent": "delivery_period",
        "text": "When will order ORD-99231 arrive? I ordered five days ago.",
    },
    {
        "intent": "track_refund",
        "text": "I returned a jacket last week. Can you tell me when my refund will post?",
    },
]

INTENT_PLAYBOOKS: dict[str, str] = {
    "cancel_order": (
        "Confirm cancellation eligibility, restate order reference if present, "
        "outline 3–5 clear steps (portal or support), and set expectations on refund timing."
    ),
    "change_order": (
        "Acknowledge the change request, confirm what can still be modified pre-shipment, "
        "and give next steps or alternatives if the order already shipped."
    ),
    "delivery_period": (
        "Provide a realistic delivery window, mention tracking if applicable, "
        "and offer to investigate if the window has passed."
    ),
    "track_refund": (
        "Confirm return received if applicable, state typical refund timeline (5–10 business days), "
        "and explain how they will be notified."
    ),
    "get_refund": (
        "Explain refund eligibility, required proof if any, and processing timeline."
    ),
    "check_refund_policy": (
        "Summarize the refund policy in plain language with key conditions and time limits."
    ),
    "place_order": (
        "Help complete or troubleshoot checkout; offer clear next steps without inventing SKUs."
    ),
    "get_invoice": (
        "Explain how to download or receive an invoice; offer to resend if email is on file."
    ),
    "check_payment_methods": (
        "List accepted payment methods and troubleshooting tips for declined cards."
    ),
    "newsletter_subscription": (
        "Confirm subscribe/unsubscribe status and how to manage preferences."
    ),
}

SYSTEM_PROMPT = """You are a Tier-1 e-commerce customer support agent for ShopEase.

Your job is to AUTONOMOUSLY RESOLVE simple tickets (order status, returns, cancellations, delivery ETA, refunds, FAQs).

Rules:
- Write ONLY the customer-facing reply (no JSON, no internal notes, no markdown headers).
- Tone: warm, professional, concise (2–4 short paragraphs max).
- Use the customer's intent and message; do not invent specific dollar amounts, tracking URLs, or order IDs unless the customer provided them.
- If placeholders like {{Order Number}} appear, keep them or substitute with the ID the customer gave.
- End with a clear next step or confirmation of what happens next.
- Do not escalate to humans unless the issue is clearly outside Tier-1 (fraud, legal threats, repeated failed refunds after 30+ days).
- Sign off as "ShopEase Support" on the last line."""


def _build_resolver_prompt(intent: str, text: str) -> str:
    playbook = INTENT_PLAYBOOKS.get(
        intent,
        "Address the customer's request directly with actionable steps appropriate for Tier-1 e-commerce support.",
    )
    return f"""Intent label: {intent}
Intent-specific guidance: {playbook}

Customer message:
\"\"\"
{text}
\"\"\"

Draft the final reply the customer should receive."""


def draft_customer_reply(intent: str, text: str, *, model: str | None = None) -> str:
    """
    Tier-1 Resolution Agent entry point.

    Args:
        intent: Classified intent (e.g. cancel_order, track_refund).
        text: Raw customer ticket body.

    Returns:
        Drafted customer reply string.
    """
    response = create_chat_completion(
        model=model or DEFAULT_MODEL,
        temperature=0.4,
        max_tokens=600,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_resolver_prompt(intent, text)},
        ],
    )
    reply = (response.choices[0].message.content or "").strip()
    if not reply:
        raise RuntimeError("Groq returned an empty resolution reply.")
    return reply


def _demo() -> None:
    sample = MOCK_TIER1_INPUTS[0]
    print("=== Tier-1 Resolver (mock input) ===")
    print(f"Input: {sample}\n")
    print(draft_customer_reply(sample["intent"], sample["text"]))


if __name__ == "__main__":
    _demo()
