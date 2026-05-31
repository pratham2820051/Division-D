"""
Unified router for Member 3 pipeline integration.

Usage:
    from agents.router import run_agent

    result = run_agent("Tier-1", intent, text)
    result = run_agent("Tier-2", intent, text)
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.escalator import generate_escalation_brief
from agents.resolver import draft_customer_reply

TIER1_ALIASES = {"tier-1", "tier1", "t1", "1", "1.0"}
TIER2_ALIASES = {"tier-2", "tier2", "t2", "2", "2.0"}


def _normalize_tier(tier: str | int | float) -> str:
    raw = str(tier).strip().lower()
    if raw in TIER1_ALIASES or raw == "tier-1":
        return "Tier-1"
    if raw in TIER2_ALIASES or raw == "tier-2":
        return "Tier-2"
    raise ValueError(f"Unknown tier: {tier!r}. Expected Tier-1 or Tier-2.")


def run_agent(tier: str | int | float, intent: str, text: str) -> dict[str, Any]:
    """
    Route a classified ticket to the correct Groq agent.

    Args:
        tier: Tier-1 or Tier-2 (also accepts 1, 2, tier1, tier2, etc.).
        intent: Intent label from the classifier.
        text: Customer ticket body.

    Returns:
        Tier-1: {"tier", "status", "intent", "text", "response"}
        Tier-2: {"tier", "status", "intent", "text", "brief"}
    """
    normalized = _normalize_tier(tier)
    base = {"tier": normalized, "intent": intent, "text": text}

    if normalized == "Tier-1":
        return {
            **base,
            "status": "RESOLVED",
            "response": draft_customer_reply(intent, text),
        }

    return {
        **base,
        "status": "ESCALATED",
        "brief": generate_escalation_brief(intent, text),
    }


def _demo() -> None:
    from agents.resolver import MOCK_TIER1_INPUTS
    from agents.escalator import MOCK_TIER2_INPUTS

    t1 = MOCK_TIER1_INPUTS[0]
    print("=== Router Tier-1 ===")
    print(run_agent("Tier-1", t1["intent"], t1["text"]))
    print()

    t2 = MOCK_TIER2_INPUTS[0]
    print("=== Router Tier-2 ===")
    import json

    out = run_agent("Tier-2", t2["intent"], t2["text"])
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    _demo()
